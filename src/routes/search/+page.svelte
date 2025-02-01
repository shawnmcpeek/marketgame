<script lang="ts">
  import { searchStocks } from '$lib/services/stockService';
  import type { StockQuote } from '$lib/services/stockService';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import type { UserData, UserStock } from '$lib/types/user';

  let searchQuery = '';
  let searchResults: StockQuote[] = [];
  let loading = false;
  let error = '';
  
  // Modal state
  let showBuyModal = false;
  let selectedStock: StockQuote | null = null;
  let quantity = 1;
  
  let purchaseError = '';
  
  function openBuyModal(stock: StockQuote) {
    selectedStock = stock;
    quantity = 1;
    showBuyModal = true;
  }

  function closeBuyModal() {
    showBuyModal = false;
    selectedStock = null;
  }

  $: totalCost = selectedStock ? quantity * selectedStock.price : 0;

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    loading = true;
    error = '';
    
    try {
      searchResults = await searchStocks(searchQuery);
    } catch (e) {
      error = 'Error searching for stocks';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function confirmPurchase() {
    if (!selectedStock || !$authStore.user) return;

    purchaseError = '';
    const totalCost = quantity * selectedStock.price;

    try {
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', $authStore.user.uid));
      if (!userDoc.exists()) {
        purchaseError = 'User data not found';
        return;
      }

      const userData = userDoc.data() as UserData;

      // Check if user has enough funds
      if (totalCost > userData.balance) {
        purchaseError = 'Insufficient funds for purchase';
        return;
      }

      // Update or add to existing holdings
      let updatedStocks = [...userData.stocks];
      const existingStock = selectedStock ? updatedStocks.find(s => s.symbol === selectedStock.symbol) : undefined;

      if (existingStock) {
        // Update existing position with weighted average price
        const totalShares = existingStock.shares + quantity;
        const totalCostBasis = (existingStock.shares * existingStock.avgPrice) + (quantity * selectedStock.price);
        const newAvgPrice = totalCostBasis / totalShares;

        updatedStocks = updatedStocks.map(s => 
          selectedStock && s.symbol === selectedStock.symbol
            ? { ...s, shares: totalShares, avgPrice: newAvgPrice }
            : s
        );
      } else {
        // Add new position
        updatedStocks.push({
          symbol: selectedStock.symbol,
          shares: quantity,
          avgPrice: selectedStock.price
        });
      }

      // Update user document
      await updateDoc(doc(db, 'users', $authStore.user.uid), {
        balance: userData.balance - totalCost,
        stocks: updatedStocks
      });

      // Close modal and show success message
      closeBuyModal();
      // Optionally show a success toast/message
    } catch (e) {
      purchaseError = 'Error processing purchase';
      console.error('Purchase error:', e);
    }
  }
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Search Stocks</h1>

  <div class="max-w-xl">
    <form on:submit|preventDefault={handleSearch} class="flex gap-2">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Enter stock name or symbol..."
        class="flex-1 rounded-lg bg-gray-600/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
      />
      <button
        type="submit"
        class="bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {/if}

  {#if searchResults.length > 0}
    <div class="grid gap-4">
      {#each searchResults as stock}
        <div class="bg-gray-700/30 border border-clover-black/20 p-4 rounded-lg shadow-xl">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-clover-pink">{stock.companyName}</h3>
              <p class="text-sm text-gray-300">Symbol: {stock.symbol}</p>
              <p class="text-sm" class:text-clover-pink={stock.change > 0} class:text-red-400={stock.change < 0}>
                ${stock.price.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
              </p>
            </div>
            <div class="flex items-center gap-4">
              <a 
                href={`/stock/${stock.symbol}`}
                class="text-clover-gray hover:text-white transition-colors"
              >
                Details
              </a>
              <button
                class="bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors"
                on:click={() => openBuyModal(stock)}
              >
                Buy Stock
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add modal at the bottom of the template -->
  {#if showBuyModal && selectedStock}
    <div class="fixed inset-0 bg-clover-black/80 flex items-center justify-center">
      <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-lg max-w-md w-full text-white">
        <h2 class="text-xl font-bold mb-4">Buy {selectedStock.symbol}</h2>
        
        <div class="space-y-4">
          <div>
            <p class="text-clover-gray">Current Price</p>
            <p class="text-xl font-bold">${selectedStock.price.toFixed(2)}</p>
          </div>

          <div>
            <label for="quantity" class="block text-sm font-medium text-clover-gray">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              bind:value={quantity}
              min="1"
              class="mt-1 block w-full rounded-lg bg-gray-800/50 border-clover-black/20 text-white placeholder-gray-400 focus:border-clover-pink focus:ring-clover-pink"
            />
          </div>

          <div class="border-t pt-4">
            <p class="text-gray-600">Total Cost</p>
            <p class="text-xl font-bold">${totalCost.toFixed(2)}</p>
          </div>

          {#if purchaseError}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {purchaseError}
            </div>
          {/if}

          <div class="flex gap-4">
            <button
              class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              on:click={closeBuyModal}
            >
              Cancel
            </button>
            <button
              class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              on:click={confirmPurchase}
            >
              Confirm Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div> 