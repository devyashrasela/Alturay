const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { sequelize } = require('./src/models');

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Sync models in development (use migrations in production)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database models synced');
    }

    app.listen(config.port, () => {
      logger.info(`🚀 Alturay server running on port ${config.port}`);
      logger.info(`📦 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
