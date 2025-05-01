// test.js
import { db } from "./user.js";

// For debugging: Insert dummy data (only if needed, otherwise comment out)
// This helps ensure that there's at least one record in the "users" node.
db.get("users").get("testuser").put({ alias: "TestUser", pub: "dummyPublicKey" });

// Inform that the fetch operation is beginning.
console.log("Attempting to fetch all users from the 'users' node...");

// Delay the fetch a little to allow for connection to be established.
setTimeout(() => {
  // Use .map().once() to fetch each record once
  db.get("users").map().once((profile, id) => {
    if (profile && profile.alias) {
      console.log(`User ID: ${id}`);
      console.log("Profile:", profile);
    } else {
      console.log(`Received empty data or missing alias for key: ${id}`);
    }
  });
}, 2000);

// Keep the process alive for a while to let asynchronous events complete
setTimeout(() => {
  console.log("Test complete. Exiting process.");
  process.exit(0);
}, 10000);
