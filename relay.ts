/* eslint-disable no-console */

import { createFromJSON } from "@libp2p/peer-id-factory";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { stdinToStream, streamToConsole } from "./stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";

async function run() {
  // Create a new libp2p node with the given multi-address
  const idRelay = await createFromJSON(peerIdRelayJson);
  const nodeListener = await createLibp2p({
    transports: [tcp()],
    peerId: idRelay,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/10333"], //
    },
  });

  // Log a message when a remote peer connects to us
  nodeListener.addEventListener("peer:connect", (evt) => {
    const remotePeer = evt.detail;
    console.log("connected to: ", remotePeer.toString());
  });

  //1.  Handle messages for the listener protocol
  const streamListener = await new Promise(async (resolve, reject) => {
    await nodeListener.handle(
      "/relay/listener/1.0.0",
      async ({ stream: streamListener }) => {
        streamToConsole(streamListener);
        resolve(streamListener);
      }
    );
  });
  //2. Handle messages for the dialer protocol
  await nodeListener.handle(
    "/relay/dialer/1.0.0",
    async ({ stream: streamDialer }) => {
      // Read the stream and output to console
      streamToConsole(streamDialer);
    }
  );
  // Output listen addresses to the console
  console.log("Listener ready, listening on:");
  nodeListener.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

run();
