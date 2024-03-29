/* eslint-disable no-console */
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { multiaddr } from "@multiformats/multiaddr";
import {
  getStreamMsg,
  postStreamMsg,
  streamToConsole,
} from "./utils/stream.js";
import { relayIpAddress } from "./utils/index.js";

const listenerPorts: number[] = [];

async function run() {
  // generator port between 10000 to 50000
  const listernPort = generatePort(10000, 50000);
  const idRelay = await createFromJSON(peerIdRelayJson);
  const nodeListener = await createLibp2p({
    transports: [tcp()],
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${listernPort}`],
    },
    streamMuxers: [yamux()],
    connectionEncryption: [noise()],
  });
  const relayMa = multiaddr(`${relayIpAddress}${idRelay.toString()}`);
  const stream = await nodeListener.dialProtocol(
    relayMa,
    "/relay/listener/1.0.0"
  );
  // Output listen addresses to the console
  console.log("Listener ready, listening on:", listernPort);
  nodeListener.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
  getStreamMsg(stream, (message) => {
    console.log("111msgs", message);
    if (message == "sayHello") {
      postStreamMsg(stream, "hello world");
    }
  });
}

// generate random port
const generatePort = function (min: number, max: number) {
  if (min < 0 || max < 0 || min > max) {
    throw new Error(
      "params error, min & max both large than 0 & min less than max"
    );
  }
  let port = Math.floor(Math.random() * (max - min)) + min;
  while (listenerPorts.includes(port)) {
    port = Math.random() * (max - min) + min;
  }
  listenerPorts.push(port);
  return port;
};
run();
