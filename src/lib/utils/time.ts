export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  // Add some debug logging
  console.log('Now:', now.toISOString());
  console.log('End Date:', endDate.toISOString());
  console.log('Difference (ms):', diff);
  
  if (diff <= 0) return 'Game Over';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''} left`;
  }
  return `${days} day${days !== 1 ? 's' : ''} left`;
} 