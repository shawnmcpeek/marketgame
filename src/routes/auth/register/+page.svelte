<script lang="ts">
  import { auth } from '$lib/firebase/firebase';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { initializeUserData } from '$lib/services/userService';
  import type { GameMode } from '$lib/types/user';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let gameMode: GameMode = 'standard';
  let name = '';

  const GAME_DURATIONS = {
    quick: 7, // 1 week
    standard: 56, // 8 weeks
    infinite: null
  };

  async function handleRegister(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const now = new Date();
      const duration = GAME_DURATIONS[gameMode as keyof typeof GAME_DURATIONS];
      const endDate = duration
        ? new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
        : null;

      await initializeUserData(
        userCredential.user.uid, 
        userCredential.user.email || email,
        gameMode,
        endDate?.toISOString() || null
      );
      
      goto('/dashboard');
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = 'An error occurred during registration';
      }
    }
  }
</script>

<div class="max-w-md mx-auto bg-gray-700/30 border border-clover-black/20 p-8 rounded-lg shadow-xl">
  <h2 class="text-2xl font-bold mb-6 text-clover-pink">Create Account</h2>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  <form class="space-y-4" on:submit={handleRegister}>
    <div>
      <label for="name" class="block text-sm font-medium text-clover-gray">Name</label>
      <input
        type="text"
        id="name"
        name="name"
        bind:value={name}
        placeholder="Name"
        required
        class="mt-1 block w-full rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
    </div>
    
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        bind:value={email}
        placeholder="Email"
        required
        class="mt-1 block w-full rounded-lg bg-gray-800/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
    </div>
    
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        bind:value={password}
        placeholder="Password"
        required
        class="mt-1 block w-full rounded-lg bg-gray-800/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
    </div>

    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
      <input
        type="password"
        id="confirmPassword"
        bind:value={confirmPassword}
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label for="gameMode" class="block text-sm font-medium text-gray-700">Game Mode</label>
      <select
        id="gameMode"
        name="gameMode"
        bind:value={gameMode}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="quick">Quick Game (1 week)</option>
        <option value="standard">Standard Game (8 weeks)</option>
        <option value="infinite">Infinite Mode</option>
      </select>
    </div>
    
    <button
      type="submit"
      class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
    >
      Register
    </button>
  </form>
  
  <div class="mt-4 text-center">
    <p class="text-sm text-gray-600">
      Already have an account? 
      <a href="/auth" class="text-blue-600 hover:text-blue-700">Login</a>
    </p>
    <p class="mt-4 text-xs text-clover-gray/80 italic">
      Market Game will never sell or share your personal data.
    </p>
  </div>
</div> 