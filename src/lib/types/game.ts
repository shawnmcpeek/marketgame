export interface CompletedGame {
  uid: string;
  endDate: string;
  startingBalance: number;
  endingBalance: number;
  gainLoss: number;
  percentageChange: number;
  gameMode: GameMode;
  duration: number;
  userName: string | null;  // For leaderboards
} 