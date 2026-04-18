import { execSync } from "child_process";

export function toRef(branch: string): string {
  return branch.startsWith("refs/") ? branch : `refs/heads/${branch}`;
}

export interface GitContext {
  commits: string;
  diffStat: string;
  diff: string;
}

const MAX_DIFF_CHARS = 1500;

export function getGitContext(workspacePath: string, targetBranch: string): GitContext {
  const exec = (cmd: string) => {
    try {
      return execSync(cmd, { cwd: workspacePath, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
    } catch {
      return "";
    }
  };

  const base = `origin/${targetBranch}`;
  const fullDiff = exec(`git diff ${base}...HEAD`);

  return {
    commits: exec(`git log ${base}..HEAD --pretty=format:"%h %s"`),
    diffStat: exec(`git diff ${base}...HEAD --stat`),
    diff: fullDiff.length > MAX_DIFF_CHARS ? fullDiff.slice(0, MAX_DIFF_CHARS) + "\n... (truncado)" : fullDiff,
  };
}

export function getRepoName(workspacePath: string): string {
  if (process.env.ADO_REPOSITORY) return process.env.ADO_REPOSITORY;

  try {
    const remote = execSync("git remote get-url origin", {
      cwd: workspacePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const match = remote.match(/\/_git\/([^/\s]+)\/?$/);
    if (match) return decodeURIComponent(match[1]);

    throw new Error(`Não foi possível extrair o nome do repo da URL: ${remote}`);
  } catch (err) {
    throw new Error(`Falha ao detectar repositório em "${workspacePath}": ${(err as Error).message}`);
  }
}
