import { seedLeetCodeProblems } from '../src/scripts/seedLeetCodeProblems.js';

seedLeetCodeProblems()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
