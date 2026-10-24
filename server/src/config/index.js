require('dotenv').config();

const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Browsers send the Origin header without a trailing slash, so normalize the
// configured client URL to avoid CORS mismatches (e.g. "…:5173/" vs "…:5173").
const normalizeOrigin = (url = '') => url.trim().replace(/\/+$/, '');

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8001,
  clientUrl: normalizeOrigin(process.env.CLIENT_URL || 'http://localhost:5173'),

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
