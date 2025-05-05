<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { username } from "./user";
  import "../app.css";
  import Gun from "gun";

  // Initialize Gun: only connect to our local Gun server.
  const gun = Gun(["http://localhost:9876/gun"]);

  // Sign out function.
  function signout() {
    // If you have a logged-in Gun user, log them out.
    // (Assuming you've set this up elsewhere; if not, you can remove this.)
    gun.user().leave();
    username.set("");
  }

  // The deleteData function sends deletion commands to clear key nodes.
  function deleteData() {
    if (
      !confirm(
        "Are you sure you want to delete ALL data on the client? This deletion command must be run on every active peer (including the Gun server)!"
      )
    ) {
      return;
    }

    // Send deletion signals to key nodes "users" and "messages".
    gun
      .get("users")
      .put(null, (ack) => console.log("Client deletion - users ack:", ack));
    gun
      .get("messages")
      .put(null, (ack) => console.log("Client deletion - messages ack:", ack));

    // Clear any client-side persistent storage.
    localStorage.clear();

    // Resend deletion commands after a delay to help ensure propagation.
    setTimeout(() => {
      gun.get("users").put(null);
      gun.get("messages").put(null);
    }, 3000);

    alert(
      "Deletion commands sent on the client. Please also trigger the deletion on your server (via /delete-data) and restart both peers if needed."
    );
  }

  // Variables to show the peer list in the UI.
  let peerCount = 0;
  let peersList = [];

  // onMount: wait a few seconds for connections to be established, then log them.
  onMount(() => {
    setTimeout(() => {
      const peers = gun.back("opt").peers;
      const peerKeys = Object.keys(peers);
      peerCount = peerKeys.length;
      peersList = peerKeys;
      for (const [url, peerConnection] of Object.entries(peers)) {
        console.log("Connected peer:", url, peerConnection);
      }
    }, 5000);
  });
</script>

<header>
  <h1>Chat App</h1>
  <span class="current-user"
    ><strong style="color: white;">{$username}</strong></span
  >
  {#if $username}
    <div class="user-bio"></div>
    <div class="button-container">
      <button class="signout-button" on:click={signout}>Sign Out</button>
      <button class="delete-button" on:click={deleteData}
        >Delete All Data</button
      >
    </div>
  {:else}
    <h3>Gun.js Chat</h3>
  {/if}
</header>
