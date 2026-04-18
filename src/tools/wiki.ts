import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { getWikiPageById, getWikiPageByPath, listWikis } from "../services/wiki.service.js";

export function registerWikiTools(server: McpServer) {
  server.registerTool(
    "list_wikis",
    {
      title: "Listar Wikis",
      description: "Lista todos os wikis disponíveis no projeto Azure DevOps.",
      inputSchema: {},
    },
    async () => {
      try {
        const wikis = await listWikis();
        if (wikis.length === 0) return { content: [{ type: "text", text: "Nenhum wiki encontrado no projeto." }] };
        const lines = wikis.map((w) => `- **${w.name}** (id: \`${w.id}\`, tipo: ${w.type})`);
        return { content: [{ type: "text", text: `## Wikis disponíveis\n\n${lines.join("\n")}` }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Erro ao listar wikis: ${(err as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_wiki_page",
    {
      title: "Ler Página do Wiki",
      description: [
        "Lê o conteúdo de uma página do wiki do Azure DevOps.",
        "Use list_wikis para obter o wikiIdentifier.",
        "Você pode buscar pelo path real da página OU pelo ID numérico que aparece na URL do wiki (_wiki/wikis/{name}/{pageId}/...).",
        "Prefira usar pageId quando disponível — é mais confiável que o path pois o slug da URL pode diferir do path real.",
      ].join(" "),
      inputSchema: {
        wikiIdentifier: z.string().describe("Nome ou ID do wiki. Use list_wikis para descobrir os wikis disponíveis."),
        path: z
          .string()
          .optional()
          .describe("Caminho real da página. Exemplo: /Team - Platform/Remoção - Migração do Autofac"),
        pageId: z.coerce
          .number()
          .optional()
          .describe("ID numérico da página, visível na URL do wiki. Exemplo: 975. Prefira este quando disponível."),
      },
    },
    async ({ wikiIdentifier, path, pageId }) => {
      try {
        if (!path && pageId === undefined) throw new Error("Informe path ou pageId para buscar a página.");

        const page = pageId !== undefined
          ? await getWikiPageById(wikiIdentifier, pageId)
          : await getWikiPageByPath(wikiIdentifier, path!);

        return { content: [{ type: "text", text: `## ${page.path}\n\n${page.content}` }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Erro ao ler página do wiki: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
