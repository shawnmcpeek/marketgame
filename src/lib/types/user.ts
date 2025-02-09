export interface UserStock {
  symbol: string;
  shares: number;
  avgPrice: number;
}

export type GameMode = 'quick' | 'standard' | 'infinite';

export interface GameHistory {
  endDate: string;
  startingBalance: number;
  endingBalance: number;
  gainLoss: number;
  percentageChange: number;
  gameMode: GameMode;
  duration: number; // in days
}

export interface UserData {
  email: string;
  name: string | null;
  balance: number;
  portfolioValue: number;
  stocks: UserStock[];
  createdAt: string;
  gameMode: GameMode;
  gameEndDate: string | null;  // null for infinite mode
} 