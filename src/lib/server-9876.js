// server-9876.js
import express from "express";
import http from "http";
import Gun from "gun";

const app = express();
const server = http.createServer(app);

const gun = Gun({
  web: server,
  file: 'data-9876.json', // Data file for this server
  multicast: false,
  localStorage: false,
  axe: false
});

// Optional: Log when a new peer connects.
gun.on("hi", (peer) => console.log("New peer connected:", peer));

// Start the Gun server on port 9876.
server.listen(9876, () => {
  console.log("Gun server running on http://localhost:9876/gun");
});