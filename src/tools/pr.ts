import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { createPullRequest } from "../services/pr.service.js";

export function registerPrTools(server: McpServer) {
  server.registerTool(
    "create_pull_request",
    {
      title: "Criar Pull Request no Azure DevOps",
      description: `Cria um Pull Request (PR) no Azure DevOps / TFS / AzureDevOps.
Use quando o usuário pedir: "crie um PR", "abra um pull request", "cria PR para master/main/develop", "fazer merge via PR", "subir PR", "criar pull request".

IMPORTANTE — antes de chamar esta tool, você DEVE:
1. Executar "git log origin/<targetBranch>..HEAD --oneline" para listar os commits
2. Executar "git diff origin/<targetBranch>...HEAD --stat" para ver arquivos alterados
3. Executar "git diff origin/<targetBranch>...HEAD" para analisar o conteúdo real das mudanças
4. Com base nesses dados, escrever uma description rica com as seções abaixo

A description DEVE conter as seções abaixo com os ícones exatos:
## 🚀 O que foi feito
Resumo em português em bullet points do que foi alterado e por quê (não apenas o nome dos arquivos, mas o propósito)

## 💡 Motivação
Por que essa mudança foi necessária? Qual problema resolve?

## 🧪 Como testar
Passos para validar as mudanças

NÃO chame esta tool com description vazia ou com apenas uma linha. Uma description rica é obrigatória. Máximo 3900 caracteres.`,
      inputSchema: {
        title: z.string().describe("Título do Pull Request no formato convencional: 'tipo: descrição curta' (ex: feat: adicionar campo UpdatedBy em DataKey)"),
        description: z.string().describe("Descrição rica do PR com seções: O que foi feito, Motivação, Como testar, Arquivos alterados. OBRIGATÓRIO — analise o diff antes de preencher. Máximo 3900 caracteres."),
        sourceBranch: z.string().describe("Branch de origem (ex: feature/minha-feature)"),
        targetBranch: z.string().optional().describe("Branch de destino. Padrão: main"),
        isDraft: z.boolean().optional().describe("Criar como rascunho"),
        workItems: z.array(z.number()).optional().describe("IDs de work items para vincular"),
        workspacePath: z
          .string()
          .describe("Caminho absoluto do workspace atual. OBRIGATÓRIO. Exemplo: /Users/onofre/Repo/meu-projeto"),
      },
    },
    async (params) => {
      try {
        const pr = await createPullRequest(params);
        return {
          content: [
            {
              type: "text",
              text: `Pull Request criado!\n\nID: #${pr.id}\nTítulo: ${pr.title}\nStatus: ${pr.status}\nLink: ${pr.url}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro ao criar Pull Request: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
