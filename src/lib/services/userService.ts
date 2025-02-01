import { db } from '$lib/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserData, GameMode } from '$lib/types/user';

const INITIAL_BALANCE = 10000;

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