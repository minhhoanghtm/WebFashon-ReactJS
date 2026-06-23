import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'ecom-backend' },
  transports: [
    new transports.Console({ format: format.simple() })
    // Add file or external transports in production
  ]
});

export default logger;
