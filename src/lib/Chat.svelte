<script>
  import { onMount } from "svelte";
  import { user, username, db } from "./user";
  import Login from "./Login.svelte";
  import SEA from "gun/sea";
  import "../app.css";

  let currentUser = "";
  let selectedContact = null;
  let contacts = [];
  let userCount = 0;
  let uniqueAliases = new Set();
  let messages = [];
  let newMessage = "";

  // Helper: Returns a consistent key for a conversation between two users
  function getConversationKey(user1, user2) {
    return [user1, user2].sort().join("-");
  }

  // Helper: Generate a shared secret for encryption
  async function getSharedSecret(contactEpub) {
    try {
      const userPair = user._.sea; // Current user's keypair
      if (!userPair || !userPair.epub || !userPair.priv) {
        throw new Error("User keypair not available");
      }
      const secret = await SEA.secret(contactEpub, userPair);
      return secret;
    } catch (error) {
      console.error("Error generating shared secret:", error);
      return null;
    }
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

  // Fetch contacts with encryption public keys
  async function fetchUsers() {
    uniqueAliases.clear();
    contacts = [];
    userCount = 0;
    db.get("users")
      .map()
      .on((profile, key) => {
        console.log("Fetched profile:", key, profile); // Debug log
        if (profile && profile.alias && profile.epub) {
          uniqueAliases.add(
            JSON.stringify({ alias: profile.alias, epub: profile.epub })
          );
          userCount = uniqueAliases.size;
          contacts = [...uniqueAliases]
            .map((item) => JSON.parse(item))
            .filter((contact) => contact.alias !== currentUser);
        }
      });
  }

  // Select a contact and load messages
  function selectContact(contact) {
    selectedContact = contact;
    loadMessages();
  }

  // Load and decrypt messages
  async function loadMessages() {
    if (!currentUser || !selectedContact || !selectedContact.epub) {
      console.log("Missing currentUser, selectedContact, or epub");
      return;
    }

    messages = [];

    const conversationKey = getConversationKey(
      currentUser,
      selectedContact.alias
    );
    console.log("Listening on conversation key:", conversationKey);

    const secret = await getSharedSecret(selectedContact.epub);
    if (!secret) {
      console.error("Cannot load messages: shared secret unavailable");
      return;
    }

    db.get("chats")
      .get(conversationKey)
      .map()
      .on(async (data, key) => {
        if (data && data.text) {
          console.log("Encrypted text:", data.text); // Debug log
          try {
            const decryptedText = await SEA.decrypt(data.text, secret);
            if (
              decryptedText &&
              !messages.find((msg) => msg.timestamp === data.timestamp)
            ) {
              messages = [...messages, { key, ...data, text: decryptedText }]
                // @ts-ignore
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
          } catch (error) {
            console.error("Error decrypting message:", error);
          }
        }
      });
  }

  // Send an encrypted message
  async function sendMessage() {
    if (
      !newMessage.trim() ||
      !currentUser ||
      !selectedContact ||
      !selectedContact.epub
    )
      return;

    const conversationKey = getConversationKey(
      currentUser,
      selectedContact.alias
    );
    const timestamp = new Date().toISOString();

    const secret = await getSharedSecret(selectedContact.epub);
    if (!secret) {
      console.error("Cannot send message: shared secret unavailable");
      return;
    }

    const encryptedText = await SEA.encrypt(newMessage, secret);
    console.log("Storing encrypted text:", encryptedText); // Debug log

    // Store message as a sub-node
    db.get("chats").get(conversationKey).get(timestamp).put({
      text: encryptedText,
      sender: currentUser,
      recipient: selectedContact.alias,
      timestamp: timestamp,
    });

    newMessage = "";
  }

  onMount(() => {
    if (currentUser) fetchUsers();
    loadMessages();
  });
</script>

{#if $username}
  <div class="full-screen-chat">
    <div class="chat-container">
      <!-- Left Sidebar: Contacts List -->
      <aside class="sidebar">
        <span style="color: white; margin: 15px;"
          ><strong>Messages</strong></span
        >
        <!-- <p class="user-count">Total Users: {userCount}</p>
        <button class="refresh-btn" on:click={fetchUsers}>
          Refresh Users
        </button> -->
        <ul class="contacts-list">
          {#if contacts.length === 0}
            <li class="no-contacts">No contacts found</li>
          {:else}
            {#each contacts as contact (contact.alias)}
              <li>
                <button
                  class="contact-btn {contact === selectedContact
                    ? 'active'
                    : ''}"
                  on:click={() => selectContact(contact)}
                  title={`Chat with ${contact.alias}`}
                >
                  {contact.alias}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </aside>
      <!-- Right Panel: Chat Window -->
      <section class="chat-window">
        {#if selectedContact}
          <header class="chat-header"><h3>{selectedContact.alias}</h3></header>
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
          <!-- Message input area -->
          <form on:submit|preventDefault={sendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              bind:value={newMessage}
              maxlength="100"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </form>
        {:else}
          <div class="no-chat"><p>Select a contact to start chatting.</p></div>
        {/if}
      </section>
    </div>
  </div>
{:else}
  <Login />
{/if}
