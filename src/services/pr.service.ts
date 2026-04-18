import { adoClient } from "../ado/client.js";
import { adoEndpoints } from "../ado/endpoints.js";
import { ADO_DEFAULT_TARGET_BRANCH } from "../config.js";
import { GitContext, getGitContext, getRepoName, toRef } from "../utils.js";

interface AdoPrResponse {
  pullRequestId: number;
  title: string;
  status: string;
  _links: { web: { href: string } };
}

export interface CreatePullRequestParams {
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch?: string;
  isDraft?: boolean;
  workItems?: number[];
  workspacePath: string;
}

export interface PullRequestResult {
  id: number;
  title: string;
  status: string;
  url: string;
}

const MAX_DESCRIPTION_CHARS = 3900;

function buildDescription(ctx: GitContext): string {
  const footer = "\n\n---\n🤖 _PR gerado com assistência de IA_";
  const budget = MAX_DESCRIPTION_CHARS - footer.length;

  const sections: { heading: string; body: string }[] = [
    {
      heading: "## ⚠️ O que foi feito",
      body: "> Descrição gerada automaticamente. Edite este PR com um resumo das mudanças.",
    },
    { heading: "## 📝 Commits", body: ctx.commits ? `\`\`\`\n${ctx.commits}\n\`\`\`` : "" },
    { heading: "## 📊 Estatísticas", body: ctx.diffStat ? `\`\`\`\n${ctx.diffStat}\n\`\`\`` : "" },
    { heading: "## 🔍 Diff", body: ctx.diff ? `\`\`\`diff\n${ctx.diff}\n\`\`\`` : "" },
  ];

  let result = "";
  for (const { heading, body } of sections) {
    if (!body) continue;
    const block = `${heading}\n\n${body}\n\n`;
    if (result.length + block.length > budget) break;
    result += block;
  }

  return result.trim() + footer;
}

export async function createPullRequest(params: CreatePullRequestParams): Promise<PullRequestResult> {
  const repository = getRepoName(params.workspacePath);
  const targetBranch = params.targetBranch ?? ADO_DEFAULT_TARGET_BRANCH;
  const repoEncoded = encodeURIComponent(repository);

  const gitContext = getGitContext(params.workspacePath, targetBranch);
  const footer = "\n\n---\n🤖 _PR gerado com assistência de IA_";
  const descBase = params.description || buildDescription(gitContext);
  const descWithFooter = descBase.includes(footer) ? descBase : descBase + footer;
  const description =
    descWithFooter.length > MAX_DESCRIPTION_CHARS
      ? descWithFooter.slice(0, MAX_DESCRIPTION_CHARS - 3) + "..."
      : descWithFooter;

  const body: Record<string, unknown> = {
    title: params.title,
    description,
    sourceRefName: toRef(params.sourceBranch),
    targetRefName: toRef(targetBranch),
    isDraft: params.isDraft ?? false,
  };

  if (params.workItems?.length) {
    body.workItemRefs = params.workItems.map((id) => ({
      id: String(id),
      url: adoClient.buildProjectUrl(adoEndpoints.workItems.edit(id)),
    }));
  }

  const pr = await adoClient.post<AdoPrResponse>(adoEndpoints.pr.create(repoEncoded), body);

  return {
    id: pr.pullRequestId,
    title: pr.title,
    status: pr.status,
    url: pr._links?.web?.href ?? adoClient.buildProjectUrl(adoEndpoints.pr.web(repoEncoded, pr.pullRequestId)),
  };
}