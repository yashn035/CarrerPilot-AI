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
    logger.info("Applying indexing strategies on MongoDB Datastore collection...");
    
    const Datastore = mongooseConnection.model('Datastore');
    
    // Apply indices to the nested fields to optimize search querying
    await Datastore.collection.createIndex({ "data.users.email": 1 }, { background: true });
    await Datastore.collection.createIndex({ "data.users.level": -1 }, { background: true });
    await Datastore.collection.createIndex({ "data.submissions.userId": 1, "data.submissions.problemId": 1 }, { background: true });
    await Datastore.collection.createIndex({ "data.interviews.userId": 1, "data.interviews.createdAt": -1 }, { background: true });
    
    logger.info("Database index optimization checks successfully applied.");
    return true;
  } catch (err) {
    logger.error("Error applying database indexes:", err);
    return false;
  }
}
