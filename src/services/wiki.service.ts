import { adoClient } from "../ado/client.js";
import { adoEndpoints } from "../ado/endpoints.js";

interface AdoApiErrorResponse {
  message?: string;
}

export interface AdoWiki {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface AdoWikiPage {
  id: number;
  path: string;
  content: string;
  subPages?: AdoWikiPage[];
}

export async function listWikis(): Promise<AdoWiki[]> {
  const data = await adoClient.get<{ value: AdoWiki[] }>(adoEndpoints.wiki.list());
  return data.value;
}

export async function getWikiPageByPath(wikiIdentifier: string, pagePath: string): Promise<AdoWikiPage> {
  const wikiEncoded = encodeURIComponent(wikiIdentifier);
  return adoClient.get<AdoWikiPage>(adoEndpoints.wiki.pageByPath(wikiEncoded), { path: pagePath, includeContent: true });
}

async function fetchWikiPageByUrl(url: string): Promise<AdoWikiPage | null> {
  return adoClient.tryRequestByUrl<AdoWikiPage>(url);
}

function findPagePathById(page: AdoWikiPage, pageId: number): string | null {
  if (page.id === pageId) return page.path;
  for (const subPage of page.subPages ?? []) {
    const found = findPagePathById(subPage, pageId);
    if (found) return found;
  }
  return null;
}

async function resolveWikiPagePathById(wikiIdentifier: string, pageId: number): Promise<string | null> {
  const wikiEncoded = encodeURIComponent(wikiIdentifier);
  const url = adoClient.buildApiUrl(adoEndpoints.wiki.pageByPath(wikiEncoded), {
    path: "/",
    recursionLevel: "Full",
    includeContent: false,
  });
  const rootPage = await adoClient.tryRequestByUrl<AdoWikiPage>(url);
  if (!rootPage) return null;
  return findPagePathById(rootPage, pageId);
}

export async function getWikiPageById(wikiIdentifier: string, pageId: number): Promise<AdoWikiPage> {
  const wikiEncoded = encodeURIComponent(wikiIdentifier);
  const candidateUrls = [
    adoClient.buildApiUrl(adoEndpoints.wiki.pageByResourceId(wikiEncoded, pageId), { includeContent: true }),
    adoClient.buildApiUrl(adoEndpoints.wiki.pageByPath(wikiEncoded), { id: pageId, includeContent: true }),
    adoClient.buildApiUrl(adoEndpoints.wiki.pageByPath(wikiEncoded), { pageId, includeContent: true }),
  ];

  for (const url of candidateUrls) {
    const page = await fetchWikiPageByUrl(url);
    if (page) return page;
  }

  const resolvedPath = await resolveWikiPagePathById(wikiIdentifier, pageId);
  if (resolvedPath) return getWikiPageByPath(wikiIdentifier, resolvedPath);

  const diagnosticsUrl = candidateUrls[0];
  const diagnosticsResponse = await adoClient.fetchByUrl(diagnosticsUrl);
  const diagnosticsText = await diagnosticsResponse.text();

  let apiMessage = diagnosticsText;
  try {
    const parsed = JSON.parse(diagnosticsText) as AdoApiErrorResponse;
    if (parsed.message) apiMessage = parsed.message;
  } catch {
    // Keep raw diagnostics text if response is not JSON.
  }

  throw new Error(
    `Nao foi possivel buscar pageId ${pageId} no wiki informado. Azure DevOps retornou ${diagnosticsResponse.status}: ${apiMessage}`
  );
}