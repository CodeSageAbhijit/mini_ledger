import { createApp } from './app';
import { logger } from './common/logger';
import { config } from './config/env';
import { buildContainer } from './container';
import { disconnectPrisma } from './infra/prisma';

async function bootstrap() {
  const container = buildContainer();
  const app = createApp(container);

  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(
      {
        port: config.PORT,
        nodeEnv: config.NODE_ENV,
        otpChannel: config.OTP_CHANNEL,
        timezone: config.APP_TIMEZONE,
      },
      `🚀 MiniLedger API server running at http://0.0.0.0:${config.PORT}`,
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, `Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      try {
        await disconnectPrisma();
        logger.info('Database connection closed. Process exiting.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during database disconnection.');
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if hanging
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during application startup');
  process.exit(1);
});
