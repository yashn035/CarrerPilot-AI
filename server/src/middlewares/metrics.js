import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, RAM, etc.)
promClient.collectDefaultMetrics({ register });

// Define custom metrics
export const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 1.5, 2, 5, 10] // latency buckets
});

export const aiRequestDuration = new promClient.Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI API calls in seconds',
  labelNames: ['provider', 'model', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 15, 30]
});

export const cacheHits = new promClient.Counter({
  name: 'ai_cache_hits_total',
  help: 'Total number of AI requests served from cache'
});

export const costSavings = new promClient.Counter({
  name: 'ai_cost_savings_estimated',
  help: 'Estimated cost savings in USD from cache hits'
});

export const adaptationEfficiency = new promClient.Histogram({
  name: 'adaptation_efficiency',
  help: 'User learning gain per question (delta skill)',
  buckets: [0, 0.05, 0.1, 0.2, 0.5]
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(aiRequestDuration);
register.registerMetric(cacheHits);
register.registerMetric(costSavings);
register.registerMetric(adaptationEfficiency);

export const metricsMiddleware = (req, res, next) => {
  const startEpoch = Date.now();
  
  // Record on finish
  res.on('finish', () => {
    const responseTimeInMs = Date.now() - startEpoch;
    const responseTimeInSeconds = responseTimeInMs / 1000;
    
    // Only track actual routes, skip 404s for non-existent paths if necessary
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(responseTimeInSeconds);
  });
  
  next();
};

export const metricsRoute = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
