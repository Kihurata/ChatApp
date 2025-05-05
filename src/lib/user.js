import Gun from "gun/gun";
import "gun/sea.js";
//import "gun/axe.js";
import { writable } from "svelte/store";

export const db = Gun(["http://localhost:9876/gun"]);
export const user = db.user().recall({ sessionStorage: true });
export const username = writable("");

user.get("alias").on((v) => username.set(v));
db.on("auth", async (event) => {
  const alias = await user.get("alias");
  username.set(alias);
  console.log(`signed in as ${alias}`);``
});
// https://grok.com/chat/0ebc4c03-2b0b-4975-b40f-310d7d9d45a9
// account:
// minhquan, thanhviet