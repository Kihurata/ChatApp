<script>
  import { user, username, db } from "./user";
  import { onMount } from "svelte";
  import Login from "./Login.svelte";

  let selectedContact = null;
  let messages = [];
  let messageText = "";
  let contacts = [];
  let userCount = 0;
  let uniqueAliases = new Set();

  // Track the current username using a store subscription.
  let currentUser;
  username.subscribe((value) => {
    currentUser = value;
    if (currentUser) {
      fetchUsers();
    } else {
      // Clear contacts and messages if user logs out.
      contacts = [];
      messages = [];
    }
  });

  // Fetch all registered users from the "users" node.
  async function fetchUsers() {
    console.log("Fetching users for user:", currentUser);
    uniqueAliases.clear();
    contacts = [];
    userCount = 0;

    // Fetch profiles from "users" (not "alias").
    db.get("users")
      .map()
      .once((profile, key) => {
        console.log(`Fetched profile at key ${key}:`, profile);
        if (profile && profile.alias) {
          uniqueAliases.add(profile.alias);
          userCount = uniqueAliases.size;
          // Filter out the current user's alias.
          contacts = [...uniqueAliases].filter((alias) => alias !== currentUser);
          console.log("Updated: userCount=", userCount, "contacts=", contacts);
        }
      });

    // Wait a short period to allow asynchronous loading.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Final fetch result: userCount=", userCount, "aliases=", [...uniqueAliases]);
  }

  // Load messages when a contact is selected.
  function loadMessages() {
    if (!selectedContact) return;
    messages = []; // Clear previous messages.

    // Listen for messages between the current user and the selected contact.
    user
      .get("messages")
      .get(`${currentUser}-${selectedContact}`)
      .map()
      .on((data) => {
        if (data) {
          // Append each new message.
          messages = [...messages, data];
        }
      });
  }

  // Select a contact to chat with.
  function selectContact(contact) {
    selectedContact = contact;
    loadMessages();
  }

  // For keyboard selection of contacts.
  function handleKeydown(event, contact) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectContact(contact);
    }
  }

  // Send a message to the selected contact.
  function sendMessage() {
    if (!messageText.trim() || !selectedContact) return;

    const message = {
      sender: currentUser,
      recipient: selectedContact,
      text: messageText,
      timestamp: Date.now(),
    };

    // Store the message in both directions for synchronicity.
    user
      .get("messages")
      .get(`${currentUser}-${selectedContact}`)
      .set(message);
    user
      .get("messages")
      .get(`${selectedContact}-${currentUser}`)
      .set(message);

    messageText = "";
  }

  // Allow sending messages with the Enter key.
  function handleKeypress(event) {
    if (event.key === "Enter") sendMessage();
  }

  onMount(() => {
    // On mount, if a user is logged in, fetch the available contacts.
    if (currentUser) {
      fetchUsers();
    }
  });
</script>

<div class="min-h-screen bg-gray-100">
  {#if $username}
    <div class="chat-container flex h-screen max-w-6xl mx-auto">
      <!-- Sidebar: Contact List -->
      <div class="sidebar w-80 bg-white border-r border-gray-200">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Messages</h2>
          <p class="text-sm text-gray-600">Total Users: {userCount}</p>
          <button on:click={fetchUsers} class="text-blue-500 hover:underline text-sm">
            Refresh Users
          </button>
        </div>
        <div class="divide-y" role="list">
          {#if contacts.length === 0}
            <div class="p-4 text-gray-500">No contacts found</div>
          {:else}
            {#each contacts as contact (contact)}
              <button
                type="button"
                class="w-full text-left p-4 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                class:selected={selectedContact === contact}
                on:click={() => selectContact(contact)}
                on:keydown={(e) => handleKeydown(e, contact)}
                aria-label={`Select ${contact} to chat`}
                aria-current={selectedContact === contact ? "true" : undefined}
              >
                {contact}
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Chat Window -->
      <div class="chat-window flex-1 bg-white flex flex-col">
        {#if selectedContact}
          <div class="messages flex-1 overflow-y-auto p-5">
            {#each messages as msg (msg.timestamp)}
              <div
                class="message mb-2 p-2 rounded-lg max-w-[70%]"
                class:sent={msg.sender === currentUser}
                class:received={msg.sender !== currentUser}
              >
                {msg.text}
              </div>
            {/each}
          </div>
          <div class="message-input flex p-2 border-t border-gray-200">
            <input
              type="text"
              bind:value={messageText}
              on:keypress={handleKeypress}
              class="flex-1 p-2 border rounded-l-lg"
              placeholder="Type a message..."
            />
            <button on:click={sendMessage} class="bg-blue-500 text-white p-2 rounded-r-lg">
              Send
            </button>
          </div>
        {:else}
          <div class="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to start chatting
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <main class="flex items-center justify-center min-h-screen">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 class="text-2xl font-bold mb-6 text-center">Welcome</h1>
        <Login />
      </div>
    </main>
  {/if}
</div>

<style>
  .selected {
    background-color: #f0f0f0;
    font-weight: 600;
  }
  .message.sent {
    background-color: #3b82f6;
    color: #fff;
    margin-left: auto;
  }
  .message.received {
    background-color: #e5e7eb;
    color: #000;
    margin-right: auto;
  }
</style>
