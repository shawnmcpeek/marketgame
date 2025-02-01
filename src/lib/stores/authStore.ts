import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true
  });

  // Set up auth state listener
  onAuthStateChanged(auth, (user) => {
    set({
      user,
      loading: false
    });
  });

  return {
    subscribe
  };
}

export const authStore = createAuthStore(); 