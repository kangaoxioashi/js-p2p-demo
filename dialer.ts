/* eslint-disable no-console */

import { createFromJSON } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import peerIdDialerJson from "./peerIds/peer-id-dialer.js";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { stdinToStream, streamToConsole } from "./stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";

async function run() {
  const [idDialer, idRelay] = await Promise.all([
    createFromJSON(peerIdDialerJson),
    createFromJSON(peerIdRelayJson),
  ]);

  // Create a new libp2p node on localhost with a randomly chosen port
  const nodeDialer = await createLibp2p({
    transports: [tcp()],
    peerId: idDialer,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
  });

  // Output this node's address
  console.log("Dialer ready, listening on:");
  nodeDialer.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });

  // Dial to the relay
  const relayMa = multiaddr(
    `/ip4/127.0.0.1/tcp/10333/p2p/${idRelay.toString()}`
  );
  const stream = await nodeDialer.dialProtocol(relayMa, "/relay/1.0.0");

  console.log("Dialer dialed to listener on protocol: /relay/1.0.0");
  console.log("Type a message and see what happens");

  // Send stdin to the stream
  stdinToStream(stream);
  // Read the stream and output to console
  streamToConsole(stream);
}

run();


// mock

