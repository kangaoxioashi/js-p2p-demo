/* eslint-disable no-console */

import { createFromJSON } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import peerIdDialerJson from "./peerIds/peer-id-dialer.js";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { stdinToStream, streamToConsole } from "./utils/stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { relayIpAddress } from "./utils/index.js";


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
  const relayMa = multiaddr(`${relayIpAddress}${idRelay.toString()}`);
  const streamRelay = await nodeDialer.dialProtocol(relayMa, "/relay/dialer/1.0.0");

  // Send stdin to the stream
  // Read the stream and output to console
  streamToConsole(streamRelay);
  // streamRelay.sink()
}

run();

// mock
