export async function awardXp(userId, amount, reason, db) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  user.xp += amount;
  const xpNeeded = user.level * 300; 
  let leveledUp = false;

  if (user.xp >= xpNeeded) {
    user.level += 1;
    user.xp = user.xp - xpNeeded;
    leveledUp = true;
  }

  if (!db.xpHistory) db.xpHistory = [];
  db.xpHistory.push({
    userId,
    amount,
    reason,
    timestamp: new Date().toISOString(),
    levelAfter: user.level
  });

  return { user, leveledUp };
}

export default {
  awardXp
};
