<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import type { UserData } from '$lib/types/user';

  let userData: UserData | null = null;
  let loading = true;

  async function loadUserData() {
    if ($authStore.user) {
      const userDoc = await getDoc(doc(db, 'users', $authStore.user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data() as UserData;
      }
    }
    loading = false;
  }

  onMount(loadUserData);
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <h1 class="text-3xl font-bold">Game History</h1>

  {#if loading}
    <div class="animate-pulse">Loading...</div>
  {:else if userData?.gameHistory?.length}
    <div class="grid gap-4">
      {#each userData.gameHistory as game}
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
                class="font-bold text-lg" 
                class:text-green-400={game.gainLoss > 0} 
                class:text-red-400={game.gainLoss < 0}
              >
                {game.gainLoss > 0 ? '+' : ''}{game.percentageChange.toFixed(2)}%
              </p>
              <p class="text-sm text-clover-gray">
                ${game.endingBalance.toLocaleString()}
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