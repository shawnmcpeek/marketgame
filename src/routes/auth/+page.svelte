<script lang="ts">
  import { auth } from '$lib/firebase/firebase';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { initializeUserData } from '$lib/services/userService';

  export let data;
  const { error: queryError } = data;

  let email = '';
  let password = '';
  let error = queryError || '';

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    error = '';

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Initialize user data if it doesn't exist
      await initializeUserData(
        userCredential.user.uid, 
        userCredential.user.email || email,
        'standard',  // Default game mode
        null  // No end date for existing users
      );
      goto('/dashboard');
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = 'An error occurred during login';
      }
    }
  }
</script>

<div class="max-w-md mx-auto bg-gray-700/30 border border-clover-black/20 p-8 rounded-lg shadow-xl">
  <h2 class="text-2xl font-bold mb-6 text-clover-pink">Login</h2>
  
  {#if error}
    <div class="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  <form class="space-y-4" on:submit={handleLogin}>
    <div>
      <label for="email" class="block text-sm font-medium text-clover-gray">Email</label>
      <input
        type="email"
        id="email"
        bind:value={email}
        required
        placeholder="Email"
        class="w-full p-2 rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
    </div>
    
    <div>
      <label for="password" class="block text-sm font-medium text-clover-gray">Password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        required
        placeholder="Password"
        class="w-full p-2 rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
    </div>
    
    <button
      type="submit"
      class="w-full bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors"
    >
      Login
    </button>
  </form>
  
  <div class="mt-4 text-center">
    <p class="text-sm text-clover-gray">
      Don't have an account? 
      <a href="/auth/register" class="text-clover-pink hover:text-white transition-colors">Register</a>
    </p>
  </div>
</div> 