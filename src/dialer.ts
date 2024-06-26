/* eslint-disable no-console */
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import peerIdDialerJson from "./peerIds/peer-id-dialer.js";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { getStreamMsg, stdinToStream } from "./utils/stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
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
    streamMuxers: [yamux()],
    connectionEncryption: [noise()],
  });

  // Output this node's address
  console.log("Dialer ready, listening on:");
  nodeDialer.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });

  // Dial to the relay
  const relayMa = multiaddr(`${relayIpAddress}${idRelay.toString()}`);
  const streamRelay = await nodeDialer.dialProtocol(
    relayMa,
    "/relay/dialer/1.0.0"
  );

  //  get listener address
  const relayMessage = await getStreamMsg(streamRelay);
  streamRelay.close();
  console.log("111listenerAddress", relayMessage, relayMessage[0]);
  if (relayMessage?.length) {
    const streamListener = await nodeDialer.dial(relayMessage[0]);
    stdinToStream(streamListener);
    // get replay message from listener
    const listenerMessage = await getStreamMsg(streamRelay);
    console.log("111listenerMessage", listenerMessage);
  }
  // streamRelay.sink()
}

run();

// mock
