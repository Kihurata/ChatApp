<script>
  import { onMount } from "svelte";
  import { user, username, db } from "./user";
  import ChatMessage from "./ChatMessage.svelte";
  import Login from "./Login.svelte";

  let currentUser = "";
  let selectedContact = "";
  let contacts = [];
  let userCount = 0;
  let uniqueAliases = new Set();
  let messages = [];

  // Helper: Returns a consistent key for a conversation between two users
  function getConversationKey(user1, user2) {
    return [user1, user2].sort().join("-");
  }

  // Monitor the username store
  username.subscribe((value) => {
    currentUser = value;
    if (currentUser) {
      fetchUsers();
    } else {
      contacts = [];
      messages = [];
    }
  });

  // Fetch contacts from Gun.js in real time.
  function fetchUsers() {
    uniqueAliases.clear();
    contacts = [];
    userCount = 0;
    db.get("users")
      .map()
      .on((profile, key) => {
        if (profile && profile.alias) {
          uniqueAliases.add(profile.alias);
          userCount = uniqueAliases.size;
          contacts = [...uniqueAliases].filter(
            (alias) => alias !== currentUser
          );
        }
      });
  }

  // When a contact is selected, update the conversation.
  function selectContact(contact) {
    selectedContact = contact;
    loadMessages();
  }

  // loadMessages subscribes to the conversation node and logs incoming messages.
  function loadMessages() {
    if (!currentUser || !selectedContact) {
      console.log("Missing currentUser or selectedContact.");
      return;
    }

    // Clear previous messages.
    messages = [];

    const conversationKey = getConversationKey(currentUser, selectedContact);
    console.log("Listening on conversation key:", conversationKey);
    console.log(
      "currentUser:",
      currentUser,
      "selectedContact:",
      selectedContact
    );

    user
      .get("messages")
      .get(conversationKey)
      .map()
      .on((data, key) => {
        // Log the raw data in full for debugging:
        console.log(`Raw data for key ${key}:`, JSON.stringify(data, null, 2));

        if (data && data.text) {
          // Avoid duplicate messages in our local array.
          if (!messages.find((msg) => msg.key === key)) {
            messages = [...messages, { key, ...data }];
          }

          // Normalize the values for comparison.
          const sender = (data.sender || "").trim().toLowerCase();
          const recipient = (data.recipient || "").trim().toLowerCase();
          const currentNorm = currentUser.trim().toLowerCase();
          const contactNorm = selectedContact.trim().toLowerCase();

          console.log(
            "Normalized values - sender:",
            sender,
            ", recipient:",
            recipient
          );

          // Log the message if it's sent by the current user to the selected contact.
          if (sender === currentNorm && recipient === contactNorm) {
            console.log(
              `Message SENT by ${currentUser} to ${selectedContact}: "${data.text}"`
            );
          }
          // Log the message if it's sent by the selected contact to the current user.
          else if (sender === contactNorm && recipient === currentNorm) {
            console.log(
              `Message RECEIVED by ${currentUser} from ${selectedContact}: "${data.text}"`
            );
          }
          // Otherwise, log that the message does not meet the expected conditions.
          else {
            console.log(
              "Message does not match expected sender/recipient conditions:",
              data
            );
          }
        } else {
          console.log("Received empty or invalid data for key:", key);
        }
      });
  }

  onMount(() => {
    loadMessages();
  });

  onMount(() => {
    if (currentUser) fetchUsers();
  });
</script>

{#if $username}
  <div class="full-screen-chat">
    <div class="chat-container">
      <!-- Left Sidebar: Contacts List -->
      <aside class="sidebar">
        <h2>Contacts</h2>
        <p class="user-count">Total Users: {userCount}</p>
        <button class="refresh-btn" on:click={fetchUsers}>
          Refresh Users
        </button>
        <ul class="contacts-list">
          {#if contacts.length === 0}
            <li class="no-contacts">No contacts found</li>
          {:else}
            {#each contacts as contact (contact)}
              <li>
                <button
                  class="contact-btn"
                  on:click={() => selectContact(contact)}
                  title={`Chat with ${contact}`}
                >
                  {contact}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </aside>
      <!-- Right Panel: Chat Window -->
      <section class="chat-window">
        {#if selectedContact}
          <header class="chat-header"><h3>{selectedContact}</h3></header>
          <!-- Old messages container -->
          <div class="old-messages">
            {#each messages as msg (msg.timestamp)}
              <div
                class="message {msg.sender === currentUser
                  ? 'sent'
                  : 'received'}"
              >
                {msg.text}
              </div>
            {/each}
          </div>
          <!-- Message input area from ChatMessage.svelte -->
          <ChatMessage {currentUser} {selectedContact} />
        {:else}
          <div class="no-chat"><p>Select a contact to start chatting.</p></div>
        {/if}
      </section>
    </div>
  </div>
{:else}
  <Login />
{/if}

<style>
  :global(#app) {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    text-align: left !important;
  }
  .full-screen-chat {
    width: 100vw;
    height: 100vh;
    background-color: #fff;
    color: #000;
  }
  .chat-container {
    display: flex;
    height: 100%;
  } /* Left Sidebar */
  .sidebar {
    width: 320px;
    background-color: #fff;
    border-right: 1px solid #ccc;
    padding: 16px;
  }
  .sidebar h2 {
    margin: 0 0 8px;
    font-size: 1.5em;
  }
  .user-count {
    font-size: 0.9em;
    margin-bottom: 12px;
  }
  .refresh-btn {
    margin-bottom: 16px;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background-color: #007aff;
    color: #fff;
    cursor: pointer;
  }
  .contacts-list,
  .contacts-list li {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .contacts-list li {
    margin-bottom: 8px;
  }
  .contact-btn {
    width: 100%;
    text-align: left;
    padding: 10px;
    background-color: #f5f5f5;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .contact-btn:hover {
    background-color: #e0e0e0;
  }
  .no-contacts {
    font-size: 0.9em;
    color: #888;
  } /* Right Panel */
  .chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #fff;
  }
  .chat-header {
    padding: 16px;
    border-bottom: 1px solid #ccc;
  }
  .chat-header h3 {
    margin: 0;
    font-size: 1.25em;
  }
  .old-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background-color: #f9f9f9;
  }
  .message {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 12px;
    max-width: 70%;
    word-wrap: break-word;
  }
  .message.sent {
    background-color: #dbf4ff;
    margin-left: auto;
  }
  .message.received {
    background-color: #e5e5ea;
  }
  .no-chat {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.1em;
    color: #666;
  }
</style>
