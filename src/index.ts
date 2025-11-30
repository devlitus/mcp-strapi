#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import './config/environment.js';

/**
 * MCP Server for Strapi CRUD Operations
 *
 * This server provides tools to perform CRUD operations on Strapi content types
 * using the Model Context Protocol over stdio transport.
 */

async function main() {
  console.error('========================================');
  console.error('  MCP Strapi Server v1.0.0');
  console.error('========================================');
  console.error('[MAIN] Starting MCP server with stdio transport...');

  try {
    // Create the MCP server instance
    const server = createMcpServer();

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('[MAIN] Server connected successfully');
    console.error('[MAIN] Ready to receive MCP requests via stdio');
    console.error('========================================');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('[MAIN] Received SIGINT, shutting down...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('[MAIN] Received SIGTERM, shutting down...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('[MAIN ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('[MAIN FATAL ERROR]', error);
  process.exit(1);
});
