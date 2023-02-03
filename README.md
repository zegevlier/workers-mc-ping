# Minecraft ping on workers

This is a simple implementation of the Minecraft ping in workers. It currently relies on a not-yet-stable API, so it will probably break before it can be used on Cloudflare's edge.

## Usage

This worker does not run on Cloudflare's edge, so you will need to run workers locally using [`workerd`](https://github.com/cloudflare/workerd/). Build `wokerd` using the instructions on their repo. Then you can use the following command to build and run the worker:

```bash
npm run dev
```

This will watch for changes to the code and restart workerd. Now, you can ping a minecraft server with the following command:

```bash
curl localhost:8080?ip=<ip>[:port]
# Examples:
curl localhost:8080?ip=play.hypixel.net
curl localhost:8080?ip=play.hypixel.net:25565
```

## Possible improvements

- [x] Support SRV records using DoH
- [ ] Make error messages better if the ping didn't work
