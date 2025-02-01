<script lang="ts">
  import { onMount } from 'svelte';
  import { getStockQuote } from '$lib/services/stockService';
  import type { StockQuote } from '$lib/services/stockService';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import type { UserData, UserStock } from '$lib/types/user';

  export let data;
  const { symbol } = data;

  let stockData: StockQuote | null = null;
  let userData: UserData | null = null;
  let loading = true;
  let error = '';
  let shareAmount = 1;

  async function loadData() {
    try {
      const [stockQuote, userDoc] = await Promise.all([
        getStockQuote(symbol),
        $authStore.user ? getDoc(doc(db, 'users', $authStore.user.uid)) : null
      ]);

      stockData = stockQuote;
      if (userDoc?.exists()) {
        userData = userDoc.data() as UserData;
      }
    } catch (e) {
      error = 'Error loading data';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function buyStock() {
    if (!$authStore.user || !stockData || !userData) return;

    const price = stockData.price;
    const totalCost = price * shareAmount;

    if (totalCost > userData.balance) {
      error = 'Insufficient funds';
      return;
    }

    try {
      const userRef = doc(db, 'users', $authStore.user.uid);
      const existingStock = userData.stocks.find((s) => s.symbol === symbol);

      let updatedStocks = [...userData.stocks];
      if (existingStock) {
        updatedStocks = updatedStocks.map((s: UserStock) => 
          s.symbol === symbol 
            ? { ...s, shares: s.shares + shareAmount }
            : s
        );
      } else {
        updatedStocks.push({
          symbol,
          shares: shareAmount,
          avgPrice: price
        });
      }

      await updateDoc(userRef, {
        balance: userData.balance - totalCost,
        stocks: updatedStocks,
        portfolioValue: userData.portfolioValue + totalCost
      });

      await loadData();
      error = '';
    } catch (e) {
      error = 'Error processing purchase';
      console.error(e);
    }
  }

  async function sellStock() {
    if (!$authStore.user || !stockData || !userData) return;

    const existingStock = userData.stocks.find((s) => s.symbol === symbol);
    if (!existingStock || existingStock.shares < shareAmount) {
      error = 'Insufficient shares';
      return;
    }

    const price = stockData.price;
    const totalValue = price * shareAmount;

    try {
      const userRef = doc(db, 'users', $authStore.user.uid);
      let updatedStocks = [...userData.stocks];

      if (existingStock.shares === shareAmount) {
        updatedStocks = updatedStocks.filter((s: UserStock) => s.symbol !== symbol);
      } else {
        updatedStocks = updatedStocks.map((s: UserStock) => 
          s.symbol === symbol 
            ? { ...s, shares: s.shares - shareAmount }
            : s
        );
      }

      await updateDoc(userRef, {
        balance: userData.balance + totalValue,
        stocks: updatedStocks,
        portfolioValue: userData.portfolioValue - totalValue
      });

      await loadData();
      error = '';
    } catch (e) {
      error = 'Error processing sale';
      console.error(e);
    }
  }

  onMount(loadData);
</script>

<div class="space-y-6">
  {#if loading}
    <div class="flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-clover-pink"></div>
    </div>
  {:else if error}
    <div class="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
      {error}
    </div>
  {:else if stockData}
    <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-xl">
      <h1 class="text-3xl font-bold mb-4 text-clover-pink">{symbol}</h1>
      
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p class="text-clover-gray">Current Price</p>
          <p class="text-2xl font-bold">${stockData.price.toFixed(2)}</p>
        </div>
        <div>
          <p class="text-clover-gray">Change</p>
          <p class="text-2xl font-bold" 
            class:text-clover-pink={stockData.change > 0} 
            class:text-red-400={stockData.change < 0}
          >
            {stockData.change.toFixed(2)}
          </p>
        </div>
      </div>

      {#if $authStore.user && userData}
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <input
              type="number"
              bind:value={shareAmount}
              min="1"
              class="w-24 rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
            />
            <button
              class="bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors"
              on:click={buyStock}
            >
              Buy
            </button>
            <button
              class="bg-clover-gray text-white px-4 py-2 rounded-lg hover:bg-clover-black transition-colors"
              on:click={sellStock}
            >
              Sell
            </button>
          </div>

          <p class="text-sm text-clover-gray">
            Available Balance: ${userData.balance.toLocaleString()}
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div> 