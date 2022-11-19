/*
The Packet class is copied and modified from an old school project
The fetch handler is based on the sample TCP fetch handler from workerd
For usage, see README.md
*/

const SEGMENT_BITS = 0x7f;
const CONTINUE_BIT = 0x80;

class Packet {
    buffer = [];

    resetBuffer() {
        this.buffer = [];
    }

    setBuffer(buffer) {
        this.buffer = [...buffer];
    }

    length() {
        return this.buffer.length;
    }

    toBytes(packetId) {
        let packetIDPacket = new Packet();
        packetIDPacket.writeVarInt(packetId);
        packetIDPacket.writeBytes(this.buffer);
        let lengthPacket = new Packet();
        lengthPacket.writeVarInt(packetIDPacket.buffer.length);
        lengthPacket.writeBytes(packetIDPacket.buffer);
        return lengthPacket.buffer;
    }

    writeByte(value) {
        this.writeBytes([value]);
    }

    writeBytes(value) {
        this.buffer.push(...value);
    }

    readByte() {
        let r = this.buffer.shift();
        if (r === undefined) {
            throw new Error('Runtime Error: Cannot read empty buffer.');
        }
        return r;
    }

    readBytes(amount) {
        return this.buffer.splice(0, amount);
    }

    writeVarInt(input) {
        let value = input;
        while (true) {
            if ((value & ~SEGMENT_BITS) === 0) {
                this.writeByte(value);
                return;
            }
            this.writeByte((value & SEGMENT_BITS) | CONTINUE_BIT);
            value >>>= 7;
        }
    }

    readVarInt() {
        let value = 0;
        let position = 0;
        let currentByte;

        while (true) {
            currentByte = this.readByte();
            value |= (currentByte & SEGMENT_BITS) << position;

            if ((currentByte & CONTINUE_BIT) === 0) {
                break;
            }

            position += 7;

            if (position >= 32) {
                throw new Error('VarInt too big :(');
            }
        }

        return value;
    }

    readUnsignedShort() {
        const bytes = this.readBytes(2);
        return (bytes[0] << 8) | bytes[1];
    }

    writeUnsignedShort(value) {
        this.writeBytes([(value & 0xff00) >> 8, (value & 0x00ff) >> 0]);
    }

    readString() {
        const l = this.readVarInt();
        let dec = new TextDecoder();
        let str = dec.decode(new Uint8Array(this.readBytes(l)));
        return str;
    }

    writeString(value) {
        const length = value.length;
        let enc = new TextEncoder();
        this.writeVarInt(length);
        this.writeBytes([...enc.encode(value)]);
    }
}

export default {
    async fetch(req) {
        const url = new URL(req.url);
        let ip = url.searchParams.get("ip");
        if (ip.split(":").length == 1) {
            ip = ip + ":25565";
        }
        console.log("Trying to ping", ip);

        try {
            const socket = connect(ip);
            const writer = socket.writable.getWriter()

            let handshake_packet = new Packet();
            handshake_packet.writeVarInt(760);
            handshake_packet.writeString(ip.split(':')[0]);
            handshake_packet.writeUnsignedShort(25565);
            handshake_packet.writeVarInt(1);
            await writer.write(new Uint8Array(handshake_packet.toBytes(0)));

            let status_packet = new Packet();
            await writer.write(new Uint8Array(status_packet.toBytes(0)));

            const reader = socket.readable.getReader();
            let arr = [];

            while (true) {
                const res = await reader.read();

                // Minecraft doesn't always close the connection here for some reason, so we need to parse the packet length
                if (res.done) {
                    console.log("Stream done, socket connection has been closed.");
                    break;
                }
                arr.push(...res.value);
                if (arr.length > 5) { // A status packet is very likely to be larger than 5 bytes, and then we know we can always read a whole varint from it.
                    let packet = new Packet();
                    packet.setBuffer(arr);
                    let length = packet.readVarInt();
                    console.log("Packet length:", length, "Buffer length:", arr.length);
                    if (length <= packet.length()) {
                        console.log("Got full packet");
                        break;
                    }
                }
            }

            console.log("Read ", arr.length, " from Minecraft server");

            let packet = new Packet();
            packet.setBuffer(arr);
            packet.readVarInt(); // length
            packet.readVarInt(); // packet id
            let json = packet.readString();
            return new Response(json, {
                headers: {
                    "content-type": "application/json",
                },
            });
        } catch (error) {
            return new Response("Socket connection failed" + error, { status: 500 });
        }
    }
};
