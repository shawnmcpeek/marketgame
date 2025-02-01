<script lang="ts">
  import "../app.css";
  import { authStore } from '$lib/stores/authStore';
  import { auth } from '$lib/firebase/firebase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Get the current path from load function
  export let data;

  $: path = data.path;
  
  // List of routes that don't require authentication
  const unprotectedRoutes = ['/', '/auth', '/auth/register'];

  onMount(() => {
    // Subscribe to auth state changes
    const unsubscribe = authStore.subscribe((authState) => {
      if (!authState.loading) {  // Only check after initial load
        const isProtectedRoute = !unprotectedRoutes.includes(path);
        
        if (!authState.user && isProtectedRoute) {
          // Redirect to login if trying to access protected route while not logged in
          goto('/auth');
        } else if (authState.user && path === '/auth') {
          // Redirect to dashboard if trying to access login while logged in
          goto('/dashboard');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-clover-black to-gray-700 text-white">
  <nav class="bg-clover-black/50 backdrop-blur-sm shadow-lg border-b border-clover-gray/20">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <a href="/" class="text-xl font-bold text-clover-pink">Market Game</a>
        </div>
        <div class="flex items-center space-x-4">
          {#if $authStore.user}
            <a 
              class="text-clover-gray hover:text-white transition-colors"
              href="/dashboard">Dashboard</a>
            <a 
              class="text-clover-gray hover:text-white transition-colors"
              href="/search">Search/Buy Stocks</a>
            <a 
              class="text-clover-gray hover:text-white transition-colors"
              href="/profile">Profile</a>
            <button 
              class="text-clover-gray hover:text-white transition-colors"
              on:click={() => auth.signOut()}>Logout</button>
          {:else}
            <a 
              class="text-clover-gray hover:text-white transition-colors"
              href="/auth">Login</a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  {#if $authStore.loading}
    <div class="flex justify-center items-center h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  {:else}
    <main class="max-w-6xl mx-auto px-4 py-8">
      <slot />
    </main>
  {/if}
</div> 