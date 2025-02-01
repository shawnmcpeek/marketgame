<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import type { UserData } from '$lib/types/user';

  let userData: UserData | null = null;
  let loading = true;
  let error = '';
  let success = '';
  let name = '';

  async function loadUserData() {
    if ($authStore.user) {
      const userDoc = await getDoc(doc(db, 'users', $authStore.user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data() as UserData;
        name = userData.name || '';
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
  {/if}
</div> 