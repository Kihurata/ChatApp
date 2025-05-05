import Gun from "gun/gun";
import "gun/sea.js";
//import "gun/axe.js";
import { writable } from "svelte/store";

//export const db = Gun(["http://localhost:9876/gun"]);
export const db = Gun();
export const user = db.user().recall({ sessionStorage: true });
export const username = writable("");

user.get("alias").on((v) => username.set(v));
db.on("auth", async (event) => {
  const alias = await user.get("alias");
  username.set(alias);
  console.log(`signed in as ${alias}`);
  ``;
});
// account:
// minhquan, thanhviet
