# This configuration is based on the TCP sample configuration in workerd/samples/tcp/config.capnp
# The two differences are the name of the js file and that the proxy is removed.

using Workerd = import "/workerd/workerd.capnp";

const minecraftPing :Workerd.Config = (
  services = [
    (name = "main", worker = .minecraftWorker),
  ],

  sockets = [ ( name = "http", address = "*:8080", http = (), service = "main" ) ]
);

# The definition of the actual worker exposed using the "main" service.
const minecraftWorker :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "mcping.js")
  ],
  compatibilityDate = "2022-09-26",
  compatibilityFlags = ["tcp_sockets_support"],
);
