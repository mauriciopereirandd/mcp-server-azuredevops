import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  return value;
}

export const ADO_ORG_URL = requireEnv("ADO_ORG_URL").replace(/\/$/, "");
export const ADO_PROJECT = requireEnv("ADO_PROJECT");
export const ADO_PAT_TOKEN = requireEnv("ADO_PAT_TOKEN");
export const ADO_API_VERSION = process.env.ADO_API_VERSION ?? "7.1";
export const ADO_DEFAULT_TARGET_BRANCH = process.env.ADO_DEFAULT_TARGET_BRANCH ?? "main";

export const authHeader = `Basic ${Buffer.from(`:${ADO_PAT_TOKEN}`).toString("base64")}`;
