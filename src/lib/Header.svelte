<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { username } from "./user"; // assuming username is a Svelte store
  // Note: We no longer use "user" for deletion commands; we work directly with our Gun instance.
  import Gun from "gun";

  // Initialize Gun: only connect to our local Gun server.
  const gun = Gun({
    peers: ["http://localhost:8765/gun"],
    radisk: false, // Disable persistent storage for testing deletions
    localStorage: false,
  });

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
  {#if $username}
    <div class="user-bio">
      <span>Hello <strong>{$username}</strong></span>
    </div>
    <p>Connected peers: {peerCount}</p>
    <ul>
      {#each peersList as peer}
        <li>{peer}</li>
      {/each}
    </ul>
    <button class="signout-button" on:click={signout}>Sign Out</button>
    <button class="signout-button" on:click={deleteData}>Delete All Data</button
    >
  {:else}
    <h3>Gun.js Chat</h3>
  {/if}
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background-color: #007aff;
    color: white;
    flex-direction: column;
  }
  .user-bio {
    margin-bottom: 10px;
  }
  button {
    margin: 5px;
    padding: 8px 16px;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    background-color: #ff3b30;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  button:hover {
    background-color: #e02e25;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    font-size: 0.9rem;
  }
</style>
