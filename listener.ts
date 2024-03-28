/* eslint-disable no-console */

import { createFromJSON } from "@libp2p/peer-id-factory";
import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import peerIdRelayJson from "./peerIds/peer-id-relay.js";
import { multiaddr } from "@multiformats/multiaddr";
import { getStreamMsg, streamToConsole } from "./utils/stream.js";
import { relayIpAddress } from "./utils";

const listenerPorts: number[] = [];

async function run() {
  // generator port between 10000 to 50000
  const listernPort = generatePort(10000, 50000);
  const idRelay = createFromJSON(peerIdRelayJson);

  const nodeListener = await createLibp2p({
    transports: [tcp()],
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${listernPort}`],
    },
  });

  const relayMa = multiaddr(`${relayIpAddress}${idRelay.toString()}`);
  const stream = await nodeListener.dialProtocol(
    relayMa,
    "/relay/listener/1.0.0"
  );

  // Log a message when a remote peer connects to us
  nodeListener.addEventListener("peer:connect", (evt) => {
    const remotePeer = evt.detail;
    // get dialer address
    console.log("connected to: ", remotePeer.toString());
  });

  // Handle messages from the dialer
  await nodeListener.handle("/dialer/1.0.0", async ({ stream, connection }) => {
    streamToConsole(stream);
    const msgs = (await getStreamMsg(stream)) as string[];
    if (msgs[0] == "sayHello") {
    }
  });

  // Output listen addresses to the console
  console.log("Listener ready, listening on:");
  nodeListener.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString());
  });
}

// generate random port
const generatePort = function (min: number, max: number) {
  if (min < 0 || max < 0 || min > max) {
    throw new Error(
      "params error, min & max both large than 0 & min less than max"
    );
  }
  let port = Math.random() * (max - min) + min;
  while (listenerPorts.includes(port)) {
    port = Math.random() * (max - min) + min;
  }
  listenerPorts.push(port);
  return port;
};
run();
