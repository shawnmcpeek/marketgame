<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
  import type { UserData } from '$lib/types/user';
  import type { CompletedGame } from '$lib/types/game';

  let userData: UserData | null = null;
  let completedGames: CompletedGame[] = [];
  let loading = true;
  let error = '';
  let success = '';
  let name = '';
  let currentPage = 1;
  const GAMES_PER_PAGE = 5;

  async function loadUserData() {
    if ($authStore.user) {
      const userDoc = await getDoc(doc(db, 'users', $authStore.user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data() as UserData;
        name = userData.name || '';
        
        // Load completed games
        const gamesQuery = query(
          collection(db, 'completedGames'),
          where('uid', '==', $authStore.user.uid),
          orderBy('endDate', 'desc'),
          limit(GAMES_PER_PAGE * currentPage)
        );
        const gamesSnap = await getDocs(gamesQuery);
        completedGames = gamesSnap.docs.map(doc => doc.data() as CompletedGame);
      }
    }
    loading = false;
  }

  async function updateProfile() {
    if (!$authStore.user) return;
    
    try {
      await updateDoc(doc(db, 'users', $authStore.user.uid), {
        name: name.trim() || null
      });
      success = 'Profile updated successfully';
      error = '';
    } catch (e) {
      error = 'Error updating profile';
      success = '';
      console.error(e);
    }
  }

  async function loadMoreGames() {
    currentPage++;
    await loadUserData();
  }

  onMount(loadUserData);
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <h1 class="text-3xl font-bold">Profile</h1>

  {#if loading}
    <div class="flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-clover-pink"></div>
    </div>
  {:else if userData}
    <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-xl">
      <form class="space-y-4" on:submit|preventDefault={updateProfile}>
        <div>
          <label for="email" class="block text-sm font-medium text-clover-gray">Email</label>
          <input
            type="email"
            id="email"
            value={userData.email}
            disabled
            class="mt-1 block w-full rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink cursor-not-allowed opacity-50"
          />
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-clover-gray">Name</label>
          <input
            type="text"
            id="name"
            bind:value={name}
            placeholder="Enter your name"
            class="mt-1 block w-full rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
          />
        </div>

        {#if error}
          <div class="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        {/if}

        {#if success}
          <div class="bg-clover-green/20 border border-clover-green/20 text-clover-pink px-4 py-3 rounded">
            {success}
          </div>
        {/if}

        <button
          type="submit"
          class="w-full bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors"
        >
          Update Profile
        </button>
      </form>
    </div>

    {#if completedGames.length > 0}
      <div class="mt-8">
        <h2 class="text-xl font-semibold mb-4">Completed Games</h2>
        <div class="grid gap-4">
          {#each completedGames as game}
            <div class="bg-gray-700/30 border border-clover-black/20 p-4 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-clover-gray">
                    {new Date(game.endDate).toLocaleDateString()}
                  </p>
                  <p class="font-semibold">
                    {game.gameMode} Game ({game.duration} days)
                  </p>
                </div>
                <div class="text-right">
                  <p 
                    class="font-bold text-lg font-numeric"
                    class:text-green-400={game.gainLoss > 0} 
                    class:text-red-400={game.gainLoss < 0}
                  >
                    {game.gainLoss > 0 ? '+' : ''}{game.percentageChange.toFixed(2)}%
                  </p>
                  <p class="text-sm text-clover-gray">
                    <span class="font-numeric">${game.endingBalance.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
        {#if completedGames.length >= GAMES_PER_PAGE * currentPage}
          <div class="mt-4 text-center">
            <button
              class="bg-clover-gray/20 text-white px-4 py-2 rounded-lg hover:bg-clover-gray/30 transition-colors"
              on:click={loadMoreGames}
            >
              Load More Games
            </button>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div> 