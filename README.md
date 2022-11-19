# Minecraft ping on workers

This is a simple implementation of the Minecraft ping in workers. It currently relies on a not-yet-stable API, so it will probably break before it can be used on Cloudflare's edge.

## Usage

Currently, the main branch of the [workerd repo](https://github.com/cloudflare/workerd) does not automatically support the TCP sockets, you need to update the captn' proto version. This respository contain `workerd.patch`, which makes the required changes to the `WORKSPACE` file. (Thank you to MrBBot for pointing me in the right direction). After that, build `wokerd` using the instructions on their repo. After that, you can use the following command to run the worker:

```bash
workerd serve config.capnp -w --experimental --verbose
```

Now, you can ping a minecraft server with the following command:

```bash
curl localhost:8080?ip=<ip>[:port]
# Examples:
curl localhost:8080?ip=play.hypixel.net
curl localhost:8080?ip=play.hypixel.net:25565
```

## Possible improvements

- [ ] Support SRV records, probably using DoH
- [ ] Make error messages better is the ping didn't work
