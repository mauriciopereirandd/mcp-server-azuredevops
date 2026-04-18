# MCP Server — Azure DevOps

MCP Server para integração com Azure DevOps / TFS. Permite que agentes de IA criem Pull Requests e leiam páginas de Wiki diretamente do editor.

## Ferramentas disponíveis

| Tool | Descrição |
|------|-----------|
| `create_pull_request` | Cria PR com título, descrição rica, branch origem/destino e vinculação de work items |
| `list_wikis` | Lista todos os wikis do projeto |
| `get_wiki_page` | Lê conteúdo de página do wiki por path ou ID |

## Pré-requisitos

- Node.js 18+
- PAT Token do Azure DevOps com permissões: **Code (Read & Write)**, **Wiki (Read)**

## Instalação

### Setup automático (recomendado)

```bash
npx -y -p github:mauriciopereirandd/mcp-server-azuredevops mcp-azuredevops-setup
```

Pergunta credenciais e configura Claude Code e/ou VS Code automaticamente.

### Manual (terminal)

### Claude Code

Adicione em `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "azuredevops": {
      "command": "npx",
      "args": ["-y", "github:mauriciopereirandd/mcp-server-azuredevops"],
      "env": {
        "ADO_ORG_URL": "https://tfs.suaempresa.com/Collection",
        "ADO_PROJECT": "NomeDoProjeto",
        "ADO_DEFAULT_TARGET_BRANCH": "master",
        "ADO_PAT_TOKEN": "SEU_PAT_TOKEN"
      }
    }
  }
}
```

### VS Code

Adicione em `.vscode/mcp.json` no workspace:

```json
{
  "servers": {
    "azuredevops": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:mauriciopereirandd/mcp-server-azuredevops"],
      "env": {
        "ADO_ORG_URL": "https://tfs.suaempresa.com/Collection",
        "ADO_PROJECT": "NomeDoProjeto",
        "ADO_DEFAULT_TARGET_BRANCH": "master",
        "ADO_PAT_TOKEN": "SEU_PAT_TOKEN"
      }
    }
  }
}
```

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `ADO_ORG_URL` | Sim | URL da organização/collection. Ex: `https://tfs.empresa.com/Collection` |
| `ADO_PROJECT` | Sim | Nome do projeto. Ex: `Meu Projeto` |
| `ADO_PAT_TOKEN` | Sim | Personal Access Token |
| `ADO_DEFAULT_TARGET_BRANCH` | Não | Branch padrão para PRs (default: `main`) |
| `ADO_API_VERSION` | Não | Versão da API (default: `7.1`) |

## Gerar PAT Token

1. Acesse **User Settings → Personal Access Tokens** no Azure DevOps / TFS
2. Crie token com escopos:
   - `Code` → Read & Write
   - `Wiki` → Read
3. Copie o token gerado e use em `ADO_PAT_TOKEN`

## Desenvolvimento local

```bash
git clone https://github.com/mauriciopereirandd/mcp-server-azuredevops
cd mcp-server-azuredevops
npm install
cp .env.example .env  # edite com suas credenciais
npm run dev
```

### Usar build local no MCP

```json
{
  "command": "node",
  "args": ["/caminho/absoluto/mcp-server-azuredevops/dist/index.js"]
}
```
