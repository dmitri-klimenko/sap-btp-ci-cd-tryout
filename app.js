const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'devops-lifecycle-demo',
    environment: process.env.NODE_ENV || 'development',
    instanceId: process.env.CF_INSTANCE_GUID || 'local'
  },
  transports: [
    new winston.transports.Console()
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  
  next();
});

// Routes
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed', { requestId: req.requestId });
  
  res.json({
    message: 'SAP BTP DevOps Lifecycle Demo',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    instanceId: process.env.CF_INSTANCE_GUID || 'local',
    requestId: req.requestId,
    status: 'healthy'
  });
});

app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  logger.info('Health check accessed', { 
    requestId: req.requestId,
    uptime: healthCheck.uptime 
  });
  
  res.status(200).json(healthCheck);
});

app.get('/info', (req, res) => {
  const info = {
    name: 'DevOps Lifecycle Demo',
    description: 'Demonstration of DevOps practices on SAP BTP',
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development',
    platform: process.platform,
    memory_usage: process.memoryUsage(),
    cf_instance: {
      guid: process.env.CF_INSTANCE_GUID || 'local',
      index: process.env.CF_INSTANCE_INDEX || '0',
      addr: process.env.CF_INSTANCE_ADDR || 'localhost'
    },
    requestId: req.requestId
  };
  
  logger.info('Info endpoint accessed', { requestId: req.requestId });
  res.json(info);
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    requestId: req.requestId
  });
  
  res.status(404).json({
    error: 'Not Found',
    method: req.method,
    path: req.path,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Start server only if this file is run directly (not imported in tests)
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server started successfully`, {
      port,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });
  });
}

module.exports = app;