/* eslint-disable no-console */
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { createFromJSON } from "@libp2p/peer-id-factory";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { webSockets } from "@libp2p/websockets";
import {
  stdinToStream,
  streamToConsole,
  postStreamMsg,
  getStreamMsg,
} from "./utils/stream.js";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { IncomingStreamData } from "@libp2p/interface";

// store all listener
const listenerStream: IncomingStreamData[] = [];
let dialerStream: IncomingStreamData["stream"] = null;
async function run() {
  // Create a new libp2p node with the given multi-address
  const idRelay = await createFromJSON(peerIdRelayJson);
  const nodeRelayer = await createLibp2p({
    transports: [tcp(), webSockets()],
    peerId: idRelay,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/10334"], //
    },
    streamMuxers: [yamux()],
    connectionEncryption: [noise()],
  });

  // Log a message when a remote peer connects to us
  nodeRelayer.addEventListener("peer:connect", (evt) => {
    const remotePeer = evt.detail;
    console.log("connected to: ", remotePeer.toString());
  });

  //1.  Handle messages for the listener protocol
  await nodeRelayer.handle("/relay/listener/1.0.0", async (data) => {
    listenerStream.push(data);
    // listern
    getStreamMsg(data.stream, (listenerMsg) => {
      dialerStream && postStreamMsg(dialerStream, listenerMsg);
    });
  });
  //2. Handle messages for the dialer protocol
  await nodeRelayer.handle(
    "/relay/dialer/1.0.0",
    async ({ stream: streamDialer }) => {
      // Read the stream and output to console
      // streamToConsole(streamDialer);
      dialerStream = streamDialer;
      const length = listenerStream.length;
      getStreamMsg(streamDialer, (dialMsg) => {
        // todo mock algorithm to choose one listener
        const index = Math.floor(Math.random() * length);
        const streamListener = listenerStream[index]?.stream;
        // transform message to listener
        dialMsg && streamListener && postStreamMsg(streamListener, dialMsg);
      });
    }
  );
  // Output listen addresses to the console
  console.log("Relay ready, listening on:");

  nodeRelayer.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

run();
