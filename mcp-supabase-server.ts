#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';

// Environment variables from MCP configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing required Supabase environment variables");
  process.exit(1);
}

// Initialize Supabase clients
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

class SupabaseMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "supabase-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "supabase_query",
          description: "Execute a SELECT query on Supabase database",
          inputSchema: {
            type: "object",
            properties: {
              table: {
                type: "string",
                description: "The table name to query",
              },
              select: {
                type: "string",
                description: "Columns to select (default: '*')",
                default: "*",
              },
              filter: {
                type: "object",
                description: "Filter conditions as key-value pairs",
                additionalProperties: true,
              },
              limit: {
                type: "number",
                description: "Limit number of results",
                default: 100,
              },
            },
            required: ["table"],
          },
        },
        {
          name: "supabase_insert",
          description: "Insert data into Supabase database",
          inputSchema: {
            type: "object",
            properties: {
              table: {
                type: "string",
                description: "The table name to insert into",
              },
              data: {
                type: "object",
                description: "Data to insert as key-value pairs",
                additionalProperties: true,
              },
            },
            required: ["table", "data"],
          },
        },
        {
          name: "supabase_update",
          description: "Update data in Supabase database",
          inputSchema: {
            type: "object",
            properties: {
              table: {
                type: "string",
                description: "The table name to update",
              },
              data: {
                type: "object",
                description: "Data to update as key-value pairs",
                additionalProperties: true,
              },
              filter: {
                type: "object",
                description: "Filter conditions for update",
                additionalProperties: true,
              },
            },
            required: ["table", "data", "filter"],
          },
        },
        {
          name: "supabase_delete",
          description: "Delete data from Supabase database",
          inputSchema: {
            type: "object",
            properties: {
              table: {
                type: "string",
                description: "The table name to delete from",
              },
              filter: {
                type: "object",
                description: "Filter conditions for deletion",
                additionalProperties: true,
              },
            },
            required: ["table", "filter"],
          },
        },
        {
          name: "supabase_auth_user",
          description: "Get current authenticated user information",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "supabase_query":
            return await this.handleQuery(args);
          case "supabase_insert":
            return await this.handleInsert(args);
          case "supabase_update":
            return await this.handleUpdate(args);
          case "supabase_delete":
            return await this.handleDelete(args);
          case "supabase_auth_user":
            return await this.handleAuthUser();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleQuery(args: any) {
    const { table, select = "*", filter = {}, limit = 100 } = args;
    
    let query = supabaseClient.from(table).select(select).limit(limit);
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async handleInsert(args: any) {
    const { table, data } = args;
    
    const client = supabaseAdmin || supabaseClient;
    const { data: result, error } = await client.from(table).insert(data).select();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully inserted ${result?.length || 0} record(s):\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  private async handleUpdate(args: any) {
    const { table, data, filter } = args;
    
    const client = supabaseAdmin || supabaseClient;
    let query = client.from(table).update(data);
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated ${result?.length || 0} record(s):\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  private async handleDelete(args: any) {
    const { table, filter } = args;
    
    const client = supabaseAdmin || supabaseClient;
    let query = client.from(table).delete();
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted ${result?.length || 0} record(s)`,
        },
      ],
    };
  }

  private async handleAuthUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw new Error(`Auth failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(user, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Supabase MCP server running on stdio");
  }
}

const server = new SupabaseMCPServer();
server.run().catch(console.error);