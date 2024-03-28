/* eslint-disable no-console */

import { createFromJSON } from "@libp2p/peer-id-factory";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import {
  stdinToStream,
  streamToConsole,
  postStreamMsg,
} from "./utils/stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { IncomingStreamData } from "@libp2p/interface";

// store all listener
const listenerIpAddress: string[] = [];
async function run() {
  // Create a new libp2p node with the given multi-address
  const idRelay = await createFromJSON(peerIdRelayJson);
  const nodeRelayer = await createLibp2p({
    transports: [tcp()],
    peerId: idRelay,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/10333"], //
    },
  });

  // Log a message when a remote peer connects to us
  nodeRelayer.addEventListener("peer:connect", (evt) => {
    const remotePeer = evt.detail;
    console.log("connected to: ", remotePeer.toString());
  });

  //1.  Handle messages for the listener protocol
  await nodeRelayer.handle(
    "/relay/listener/1.0.0",
    async ({ stream, connection }) => {
      streamToConsole(stream);
      console.log('111listener', connection.remoteAddr.toString())
      listenerIpAddress.push(connection.remoteAddr.toString());
    }
  );
  //2. Handle messages for the dialer protocol
  await nodeRelayer.handle(
    "/relay/dialer/1.0.0",
    async ({ stream: streamDialer }) => {
      // Read the stream and output to console
      streamToConsole(streamDialer);
      const length = listenerIpAddress.length;
      // todo 算法获取一个listener
      const index = Math.floor(Math.random() * length);
      postStreamMsg(streamDialer, listenerIpAddress[index]);
    }
  );
  // Output listen addresses to the console
  console.log("Listener ready, listening on:");
  nodeRelayer.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

run();
