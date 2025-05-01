<script>
  import { db, user } from "./user";

  let username;
  let password;

  function login() {
    console.log("Attempting login for:", username);
    user.auth(username, password, ({ err }) => {
      if (err) {
        console.error("Login error:", err);
        alert(err);
      } else {
        console.log("Login successful:", username);
      }
    });
  }

  function signup() {
    console.log("Attempting signup for:", username);
    user.create(username, password, ({ err, pub }) => {
      if (err) {
        console.error("Signup error:", err);
        alert(err);
      } else {
        console.log("Signup successful:", username);
        // Store public profile data in the "users" node.
        // This data is persisted via Radisk.
        db.get("users").get(username).put({
          alias: username,
          pub: pub, // Save the public key data (or any other public info)
          createdAt: Date.now()
        });
        // Optionally, automatically log the user in after signup
        login();
      }
    });
  }
</script>

<div class="space-y-4">
  <div>
    <label for="username" class="block text-sm font-medium text-gray-700"
      >Username</label
    >
    <input
      id="username"
      name="username"
      bind:value={username}
      minlength="3"
      maxlength="16"
      class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
  <div>
    <label for="password" class="block text-sm font-medium text-gray-700"
      >Password</label
    >
    <input
      id="password"
      name="password"
      bind:value={password}
      type="password"
      class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
  <div class="flex space-x-4">
    <button
      class="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
      on:click={login}
    >
      Login
    </button>
    <button
      class="flex-1 bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300"
      on:click={signup}
    >
      Sign Up
    </button>
  </div>
</div>
