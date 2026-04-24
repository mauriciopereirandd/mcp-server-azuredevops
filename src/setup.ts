#!/usr/bin/env node
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function askRequired(question: string): Promise<string> {
  return new Promise((resolve) => {
    const prompt = () => rl.question(question, (answer) => {
      if (answer.trim()) resolve(answer.trim());
      else { console.log("  Obrigatório."); prompt(); }
    });
    prompt();
  });
}

function resolveGlobalBin(): string | null {
  try {
    const result = execSync("which mcp-azuredevops", { encoding: "utf-8" }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function vscodeGlobalMcpPath(): string {
  let base: string;
  if (process.platform === "win32") {
    base = path.join(process.env.APPDATA ?? os.homedir(), "Code", "User");
  } else if (process.platform === "darwin") {
    base = path.join(os.homedir(), "Library", "Application Support", "Code", "User");
  } else {
    base = path.join(os.homedir(), ".config", "Code", "User");
  }
  return path.join(base, "mcp.json");
}

async function main() {
  console.log("\n=== MCP Server — Azure DevOps Setup ===\n");

  const globalBin = resolveGlobalBin();
  if (!globalBin) {
    console.log("Instalando globalmente...");
    execSync("npm install -g github:mauriciopereirandd/mcp-server-azuredevops#v1.0.0-node16", { stdio: "inherit" });
  }

  const binPath = resolveGlobalBin() ?? "mcp-azuredevops";

  const orgUrl = await askRequired("\nADO_ORG_URL (ex: https://tfs.empresa.com/Collection): ");
  const project = await askRequired("ADO_PROJECT (ex: Meu Projeto): ");
  const pat = await askRequired("ADO_PAT_TOKEN: ");
  const branch = (await ask("ADO_DEFAULT_TARGET_BRANCH [main]: ")).trim() || "main";

  const env = {
    ADO_ORG_URL: orgUrl,
    ADO_PROJECT: project,
    ADO_PAT_TOKEN: pat,
    ADO_DEFAULT_TARGET_BRANCH: branch,
  };

  console.log("\nOnde deseja configurar?");
  console.log("  1. Claude Code (~/.claude/settings.json)");
  console.log("  2. VS Code global (~/Library/.../Code/User/mcp.json)");
  console.log("  3. Ambos");

  const choice = (await ask("\nEscolha [1]: ")).trim() || "1";
  rl.close();

  if (choice === "1" || choice === "3") installClaudeCode(env, binPath);
  if (choice === "2" || choice === "3") installVSCodeGlobal(env, binPath);

  console.log("\nPronto! Reinicie o Claude Code / VS Code para carregar o servidor MCP.\n");
}

function installClaudeCode(env: Record<string, string>, binPath: string) {
  const settingsPath = path.join(os.homedir(), ".claude", "settings.json");

  let settings: any = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")); }
    catch { console.error(`  Erro ao ler ${settingsPath}. Abortando Claude Code config.`); return; }
  }

  settings.mcpServers = settings.mcpServers ?? {};
  settings.mcpServers.azuredevops = { command: binPath, env };

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`  Claude Code: ${settingsPath}`);
}

function installVSCodeGlobal(env: Record<string, string>, binPath: string) {
  const settingsPath = vscodeGlobalMcpPath();

  let settings: any = { servers: {} };
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")); }
    catch { console.error(`  Erro ao ler ${settingsPath}. Abortando VS Code config.`); return; }
  }

  settings.servers = settings.servers ?? {};
  settings.servers.azuredevops = { type: "stdio", command: binPath, env };

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`  VS Code global: ${settingsPath}`);
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
