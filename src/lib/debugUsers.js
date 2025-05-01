/** @ts-nocheck */
import Gun from "gun";
import "gun/sea"; // Enable SEA for data verification

// Initialize Gun.js
const gun = Gun(["http://localhost:8765/gun"]);

// Log connection errors
gun.on("out", (msg) => {
  if (msg.err) {
    console.error("Gun.js connection error:", msg.err);
  }
});

async function listUsers() {
  console.log("Starting to fetch users from alias node...");
  let userCount = 0;
  const uniqueAliases = new Set();

  try {
    // Subscribe to alias node with error handling
    gun
      .get("alias")
      .map()
      .on((data, alias) => {
        try {
          if (data && alias) {
            console.log(`Raw data for alias: ${alias}`, data);
            uniqueAliases.add(alias);
            userCount = uniqueAliases.size;
            console.log(`Found user: ${alias}, Current count: ${userCount}`);
          } else {
            console.log(`No data or invalid alias: ${alias}`);
          }
        } catch (err) {
          console.error(`Error processing alias ${alias}:`, err);
        }
      });

    // Wait to ensure all data is fetched
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log(`Final user count: ${userCount}`);
    console.log("Aliases:", [...uniqueAliases]);

    // Inspect alias node
    gun.get("alias").on((data) => {
      console.log("Direct alias node data:", data);
    });

    // Inspect root node
    gun.get("").on((data) => {
      console.log("Root node data:", data);
    });
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

listUsers().catch((err) => console.error("Error in listUsers:", err));
