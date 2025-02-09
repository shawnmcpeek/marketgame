import { db } from '$lib/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserData, GameMode } from '$lib/types/user';

export const INITIAL_BALANCE = 10000;

export async function initializeUserData(
  userId: string, 
  email: string, 
  gameMode: GameMode,
  gameEndDate: string | null
): Promise<UserData> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (!userDoc.exists()) {
    const userData: UserData = {
      email,
      name: null,
      balance: INITIAL_BALANCE,
      portfolioValue: 0,
      stocks: [],
      createdAt: new Date().toISOString(),
      gameMode,
      gameEndDate
    };
    
    await setDoc(doc(db, 'users', userId), userData);
    return userData;
  }
  
  return userDoc.data() as UserData;
}

export function calculatePortfolioPerformance(userData: UserData, currentPrices: Record<string, number>): {
  totalValue: number;
  totalGainLoss: number;
  percentageChange: number;
} {
  let totalValue = 0;
  let totalCost = 0;

  userData.stocks.forEach(stock => {
    const currentPrice = currentPrices[stock.symbol] || 0;
    totalValue += currentPrice * stock.shares;
    totalCost += stock.avgPrice * stock.shares;
  });

  const totalGainLoss = totalValue - totalCost;
  const percentageChange = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return { totalValue, totalGainLoss, percentageChange };
} 