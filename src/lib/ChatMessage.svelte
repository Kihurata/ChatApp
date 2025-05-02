<script>
  import { user } from "./user";

  // Helper: Returns a consistent key for a conversation between two users.
  function getConversationKey(user1, user2) {
    return [user1, user2].sort().join("-");
  }
  export let currentUser = "";
  export let selectedContact = "";
  let messageText = "";

  function sendMessage() {
    if (!messageText.trim() || !selectedContact) return;
    const conversationKey = getConversationKey(currentUser, selectedContact);
    const newMessage = {
      sender: currentUser,
      recipient: selectedContact,
      text: messageText,
      timestamp: Date.now(),
    };
    user.get("messages").get(conversationKey).set(newMessage);
    messageText = "";
  }

  function handleKeypress(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }
</script>

<div class="message-input">
  <input
    type="text"
    bind:value={messageText}
    on:keypress={handleKeypress}
    placeholder="Type a message..."
  /> <button on:click={sendMessage}>Send</button>
</div>

<style>
  .message-input {
    display: flex;
    padding: 16px;
    border-top: 1px solid #ccc;
    background-color: #fff;
  }
  input {
    flex: 1;
    padding: 8px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px 0 0 4px;
  }
  button {
    padding: 8px 16px;
    font-size: 1rem;
    border: none;
    background-color: #007aff;
    color: #fff;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  button:hover {
    background-color: #005bb5;
  }
</style>
