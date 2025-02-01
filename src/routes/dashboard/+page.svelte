<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { db } from '$lib/firebase/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { getStockQuote } from '$lib/services/stockService';
  import type { UserStock, UserData } from '$lib/types/user';
  import { formatTimeRemaining } from '$lib/utils/time';

  let userData: UserData | null = null;
  let loading = true;
  let error = '';
  let currentPrices: Record<string, number> = {};

  // Add modal state
  let showSellModal = false;
  let selectedStock: UserStock | null = null;
  let sellQuantity = 1;
  let sellError = '';

  async function loadUserData() {
    try {
      if ($authStore.user) {
        const userDoc = await getDoc(doc(db, 'users', $authStore.user.uid));
        if (userDoc.exists()) {
          userData = userDoc.data() as UserData;
          await loadCurrentPrices();
        } else {
          error = 'User data not found';
          console.error('User document does not exist');
        }
      } else {
        error = 'Not authenticated';
        console.error('No authenticated user');
      }
    } catch (e) {
      error = 'Error loading user data';
      console.error('Error in loadUserData:', e);
    }
  }

  async function loadCurrentPrices() {
    if (!userData) return;

    try {
      const symbols = userData.stocks.map(s => s.symbol);
      for (const symbol of symbols) {
        const quote = await getStockQuote(symbol);
        currentPrices[symbol] = quote.price;
      }
    } catch (e) {
      console.error('Error loading current prices:', e);
    }
  }

  function calculateStockValue(stock: UserStock): number {
    return currentPrices[stock.symbol] 
      ? currentPrices[stock.symbol] * stock.shares 
      : stock.avgPrice * stock.shares;
  }

  function calculateTotalValue(): number {
    if (!userData) return 0;
    return userData.stocks.reduce((total, stock) => total + calculateStockValue(stock), 0);
  }

  function calculateGainLoss(stock: UserStock): number {
    if (!currentPrices[stock.symbol]) return 0;
    const currentValue = calculateStockValue(stock);
    const costBasis = stock.avgPrice * stock.shares;
    return currentValue - costBasis;
  }

  function openSellModal(stock: UserStock) {
    selectedStock = stock;
    sellQuantity = 1;
    showSellModal = true;
  }

  function closeSellModal() {
    showSellModal = false;
    selectedStock = null;
    sellError = '';
  }

  async function confirmSell() {
    if (!selectedStock || !$authStore.user || !userData) return;

    const currentPrice = currentPrices[selectedStock.symbol];
    if (!currentPrice) {
      sellError = 'Current price not available';
      return;
    }

    if (sellQuantity > selectedStock.shares) {
      sellError = 'Cannot sell more shares than you own';
      return;
    }

    const saleValue = currentPrice * sellQuantity;

    try {
      const updatedStocks = [...userData.stocks];
      const stockIndex = updatedStocks.findIndex(s => s.symbol === selectedStock.symbol);

      if (selectedStock.shares === sellQuantity) {
        // Remove the stock if selling all shares
        updatedStocks.splice(stockIndex, 1);
      } else {
        // Update the shares count if selling partial position
        updatedStocks[stockIndex] = {
          ...selectedStock,
          shares: selectedStock.shares - sellQuantity
        };
      }

      await updateDoc(doc(db, 'users', $authStore.user.uid), {
        balance: userData.balance + saleValue,
        stocks: updatedStocks
      });

      await loadUserData();
      closeSellModal();
    } catch (e) {
      sellError = 'Error processing sale';
      console.error('Sale error:', e);
    }
  }

  $: sellValue = selectedStock && currentPrices[selectedStock.symbol] 
    ? sellQuantity * currentPrices[selectedStock.symbol]
    : 0;

  onMount(() => {
    loadUserData().finally(() => loading = false);
  });
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">
    {#if userData?.name}
      <span class="text-clover-pink">{userData.name}'s</span> Dashboard
    {:else}
      Dashboard
    {/if}
  </h1>
  
  {#if userData?.gameMode !== 'infinite' && userData?.gameEndDate}
    <div class="bg-gray-700/30 border border-clover-black/20 p-4 rounded-lg">
      <p class="text-lg">
        {formatTimeRemaining(new Date(userData.gameEndDate))}
      </p>
    </div>
  {/if}
  
  {#if loading}
    <div class="flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-clover-pink"></div>
    </div>
  {:else if error}
    <div class="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
      {error}
    </div>
  {:else if userData}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Account Overview</h2>
        <div class="space-y-2">
          <p>Cash Balance: <span class="text-clover-pink">${userData.balance.toLocaleString()}</span></p>
          <p>Portfolio Value: <span class="text-clover-pink">${calculateTotalValue().toLocaleString()}</span></p>
          <p>Total Value: <span class="text-clover-pink">${(userData.balance + calculateTotalValue()).toLocaleString()}</span></p>
        </div>
      </div>
      
      <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-4">Your Stocks</h2>
        {#if userData.stocks.length === 0}
          <p>You don't own any stocks yet.</p>
        {:else}
          <div class="space-y-4">
            {#each userData.stocks as stock}
              <div class="border-b border-clover-black/20 pb-2">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-semibold text-clover-pink">{stock.symbol}</h3>
                    <p class="text-sm text-gray-300">{stock.shares} shares @ ${stock.avgPrice.toFixed(2)}</p>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="font-semibold">${calculateStockValue(stock).toLocaleString()}</p>
                      <p class="text-sm" 
                        class:text-clover-pink={calculateGainLoss(stock) > 0} 
                        class:text-red-400={calculateGainLoss(stock) < 0}
                      >
                        Gain/Loss: {calculateGainLoss(stock) > 0 ? '+' : ''}${calculateGainLoss(stock).toLocaleString()}
                      </p>
                    </div>
                    <button
                      class="bg-clover-gray text-white px-4 py-2 rounded-lg hover:bg-clover-black transition-colors"
                      on:click={() => openSellModal(stock)}
                    >
                      Sell
                    </button>
                  </div>
                </div>
                {#if currentPrices[stock.symbol]}
                  <p class="text-sm text-clover-gray mt-1">
                    Current Price: ${currentPrices[stock.symbol].toFixed(2)}
                  </p>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Add sell modal at the bottom of the template -->
{#if showSellModal && selectedStock}
  <div class="fixed inset-0 bg-clover-black/80 flex items-center justify-center">
    <div class="bg-gray-700/30 border border-clover-black/20 p-6 rounded-lg shadow-lg max-w-md w-full text-white">
      <h2 class="text-xl font-bold mb-4">Sell {selectedStock.symbol}</h2>
      
      <div class="space-y-4">
        <div>
          <p class="text-clover-gray">Current Price</p>
          <p class="text-xl font-bold">${currentPrices[selectedStock.symbol]?.toFixed(2) || 'N/A'}</p>
        </div>

        <div>
          <p class="text-clover-gray">Your Position</p>
          <p>{selectedStock.shares} shares @ ${selectedStock.avgPrice.toFixed(2)}</p>
        </div>

        <div>
          <label for="sellQuantity" class="block text-sm font-medium text-clover-gray">
            Quantity to Sell
          </label>
          <input
            type="number"
            id="sellQuantity"
            bind:value={sellQuantity}
            min="1"
            max={selectedStock.shares}
            class="mt-1 block w-full rounded-md bg-gray-700/30 border-clover-black/20 text-white placeholder-clover-gray/50 focus:border-clover-pink focus:ring-clover-pink"
          />
        </div>

        <div class="border-t border-clover-black/20 pt-4">
          <p class="text-clover-gray">Sale Value</p>
          <p class="text-xl font-bold">${sellValue.toFixed(2)}</p>
        </div>

        {#if sellError}
          <div class="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
            {sellError}
          </div>
        {/if}

        <div class="flex gap-4">
          <button
            class="flex-1 bg-clover-gray/20 text-white px-4 py-2 rounded-lg hover:bg-clover-gray/30 transition-colors"
            on:click={closeSellModal}
          >
            Cancel
          </button>
          <button
            class="flex-1 bg-clover-pink text-white px-4 py-2 rounded-lg hover:bg-clover-gray transition-colors"
            on:click={confirmSell}
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 