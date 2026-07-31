import logger from '../../shared/logger/logger.js';

/**
 * Ensures indexes are applied on the Datastore model or actual collections
 * when running under real MongoDB cloud/local database mode.
 * In a true multi-collection production database, we would apply these directly
 * on separate collection schemas. Under the D-CMM datastore pattern,
 * we index key query paths to prevent lookup degradation.
 */
export async function ensureIndexes(mongooseConnection) {
  if (!mongooseConnection || mongooseConnection.readyState !== 1) {
    logger.warn("Skipping DB index applications: MongoDB connection not established (running in JSON-file database mode).");
    return false;
  }

  try {
    logger.info("Applying indexing strategies on normalized MongoDB collections...");
    
    // Import models dynamically to ensure compile checks are complete
    await import('./models.js');
    
    const User = mongooseConnection.model('User');
    const Submission = mongooseConnection.model('Submission');
    const Interview = mongooseConnection.model('Interview');
    const Resume = mongooseConnection.model('Resume');
    
    // Apply indices to the normalized collections to optimize search querying
    await User.collection.createIndex({ level: -1 }, { background: true });
    await Submission.collection.createIndex({ userId: 1, problemId: 1 }, { background: true });
    await Interview.collection.createIndex({ userId: 1, createdAt: -1 }, { background: true });
    await Resume.collection.createIndex({ userId: 1 }, { background: true });
    
    logger.info("Database index optimization checks successfully applied.");
    return true;
  } catch (err) {
    logger.error("Error applying database indexes:", err);
    return false;
  }
}
