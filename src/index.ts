#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "./config.js";
import { registerPrTools } from "./tools/pr.js";
import { registerWikiTools } from "./tools/wiki.js";

const server = new McpServer({ name: "mcp-azuredevops", version: "1.0.0" });

registerPrTools(server);
registerWikiTools(server);
// registerWorkItemTools(server);
// registerPipelineTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Erro ao iniciar servidor MCP:", err);
  process.exit(1);
});
