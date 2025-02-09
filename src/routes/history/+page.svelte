<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
  import type { CompletedGame } from '$lib/types/game';

  let completedGames: CompletedGame[] = [];
  let loading = true;

  async function loadUserData() {
    if ($authStore.user) {
      const gamesQuery = query(
        collection(db, 'completedGames'),
        where('uid', '==', $authStore.user.uid),
        orderBy('endDate', 'desc')
      );
      const gamesSnap = await getDocs(gamesQuery);
      completedGames = gamesSnap.docs.map(doc => doc.data() as CompletedGame);
    }
    loading = false;
  }

  onMount(loadUserData);
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <h1 class="text-3xl font-bold">Game History</h1>

  {#if loading}
    <div class="animate-pulse">Loading...</div>
  {:else if completedGames.length}
    <div class="grid gap-4">
      {#each completedGames as game}
        <div class="bg-gray-700/30 border border-clover-black/20 p-4 rounded-lg">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-clover-gray">
                Completed {new Date(game.endDate).toLocaleDateString()}
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
  {:else}
    <p>No completed games yet.</p>
  {/if}
</div> 