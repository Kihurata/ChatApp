// server.js (using ESM syntax)
import express from "express";
import http from "http";
import Gun from "gun";

const app = express();
const server = http.createServer(app);

const gun = Gun({
  web: server,
  radisk: false, // Disable persistence during your deletion testing
  localStorage: true,
});

// Optional: Log when a new peer connects.
gun.on("hi", (peer) => console.log("New peer connected:", peer));

// Define a deletion endpoint
app.get("/delete-data", (req, res) => {
  // Send deletion commands to clear the key nodes.
  gun
    .get("users")
    .put(null, (ack) => console.log("Server deletion - users ack:", ack));
  gun
    .get("messages")
    .put(null, (ack) => console.log("Server deletion - messages ack:", ack));

  // Resend after a delay to help propagate the deletion.
  setTimeout(() => {
    gun.get("users").put(null);
    gun.get("messages").put(null);
  }, 3000);

  res.send("Deletion commands sent on the server.");
});

// Start the Gun server on port 8765.
server.listen(8765, () => {
  console.log("Gun server running on http://localhost:8765/gun");
});
