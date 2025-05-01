import Gun from "gun";
import http from "http";

const server = http.createServer().listen(8765, () => {
  console.log("Gun.js server running on http://localhost:8765");
});

// Initialize Gun with SEA and persistence
const gun = Gun({
  web: server,
  radisk: true, // Persistent storage
  localStorage: false, // Disable browser-based storage
  on: (msg) => console.log("Server:", msg), // Debug logging
});

// Log SEA initialization
console.log("SEA enabled:", !!gun.SEA);

export default gun;
