// usersStore.js
import { writable } from "svelte/store";
import { db } from "./user.js"; // Adjust the import path as needed

export const allUsers = writable([]);

// Use .on() for continuous real-time updates.
db.get("users").map().on((profile, id) => {
  if (profile && profile.alias) {
    allUsers.update((current) => {
      // If this user doesn't already exist in the store, add it.
      if (!current.some((u) => u.key === id)) {
        return [...current, { key: id, ...profile }];
      }
      return current;
    });
  }
});
