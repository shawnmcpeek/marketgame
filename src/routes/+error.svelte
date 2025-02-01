<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="flex flex-col items-center justify-center min-h-screen">
  <h1 class="text-4xl font-bold text-clover-pink mb-4">
    {$page.status}: {$page.error?.message || 'Something went wrong'}
  </h1>
  <a href="/" class="text-clover-gray hover:text-white transition-colors">
    Return Home
  </a>
</div> 