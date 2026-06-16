import { v4 as uuidv4 } from 'uuid';
import logger from '../../shared/logger/logger.js';

class JobQueue {
  constructor() {
    this.jobs = new Map(); // jobId -> { id, type, status, payload, result, error, progress, createdAt, startedAt, completedAt }
    this.handlers = new Map(); // jobType -> handlerFunction
    this.activeWorkersCount = 0;
    this.maxWorkers = 3;
    this.isProcessing = false;
    logger.info("Background Job Queue system initialized.");
  }

  /**
   * Registers a callback handler for a specific job type
   * @param {string} type 
   * @param {Function} handler 
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    logger.info(`Registered background worker handler for job type: ${type}`);
  }

  /**
   * Adds a new task to the queue for background execution
   * @param {string} type 
   * @param {Object} payload 
   * @returns {string} jobId
   */
  addJob(type, payload) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type,
      status: 'pending',
      payload,
      result: null,
      error: null,
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    this.jobs.set(jobId, job);
    logger.info(`Job added to queue: [${type}] ID: ${jobId}`);

    // Trigger queue processing asynchronously
    setImmediate(() => this._triggerProcessing());

    return jobId;
  }

  /**
   * Retrieves the current state of a background job
   * @param {string} jobId 
   * @returns {Object|null}
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Updates job progress
   * @param {string} jobId 
   * @param {number} progress (0-100)
   */
  updateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.min(Math.max(progress, 0), 100);
      logger.debug(`Job ${jobId} progress: ${progress}%`);
    }
  }

  /**
   * Triggers processing loop
   */
  _triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this._processNext().catch(err => {
      logger.error("Error in background job queue processing loop:", err);
      this.isProcessing = false;
    });
  }

  /**
   * Internal loop worker
   */
  async _processNext() {
    // Find next pending job
    let nextJob = null;
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        nextJob = job;
        break;
      }
    }

    if (!nextJob || this.activeWorkersCount >= this.maxWorkers) {
      this.isProcessing = false;
      return;
    }

    // Process job
    this.activeWorkersCount++;
    const job = nextJob;
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    logger.info(`Worker starting job: [${job.type}] ID: ${job.id}`);

    const handler = this.handlers.get(job.type);
    
    // Self-executing worker promise so it runs in background
    (async () => {
      try {
        if (!handler) {
          throw new Error(`No background handler registered for job type: ${job.type}`);
        }
        
        // Execute the handler
        const result = await handler(job.payload, (progress) => this.updateProgress(job.id, progress));
        
        job.status = 'completed';
        job.result = result;
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        logger.info(`Job completed successfully: [${job.type}] ID: ${job.id}`);
      } catch (err) {
        job.status = 'failed';
        job.error = err.message || 'Unknown error occurred during execution';
        job.completedAt = new Date().toISOString();
        logger.error(`Job failed in background: [${job.type}] ID: ${job.id}`, err);
      } finally {
        this.activeWorkersCount--;
        // Trigger next immediately
        setImmediate(() => this._triggerProcessing());
      }
    })();

    // Check if we can process another concurrent job immediately
    if (this.activeWorkersCount < this.maxWorkers) {
      setImmediate(() => this._processNext());
    } else {
      this.isProcessing = false;
    }
  }
}

const queue = new JobQueue();
export default queue;
