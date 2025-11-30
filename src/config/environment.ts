import { config } from 'dotenv';

// Load environment variables
config();

export const environment = {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
  strapiApiToken: process.env.STRAPI_API_TOKEN || '',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// Validate required environment variables
if (!environment.strapiUrl) {
  console.error('[ERROR] STRAPI_URL is required');
  process.exit(1);
}

// Log configuration on startup (to stderr to not interfere with MCP protocol)
console.error(`[CONFIG] Strapi URL: ${environment.strapiUrl}`);
console.error(`[CONFIG] Environment: ${environment.nodeEnv}`);
