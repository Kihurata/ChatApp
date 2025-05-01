import GUN from "gun";
let gun1 = GUN();
let alice = gun1.get("alice").put({ name: "alice", age: 22 });
alice.on(function (node) {
  console.log("Subscribed to Alice!", node);
});

gun1.get("bob").once(function (node) {
  console.log("Bob!", node);
});
