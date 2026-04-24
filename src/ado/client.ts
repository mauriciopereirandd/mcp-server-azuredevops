import fetch, { Headers, RequestInit, Response } from "node-fetch";
import { ADO_API_VERSION, ADO_ORG_URL, ADO_PROJECT, authHeader } from "../config.js";

type QueryValue = string | number | boolean | null | undefined;

function applyQuery(url: URL, query?: Record<string, QueryValue>) {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
}

export class AdoClient {
  constructor(
    private readonly orgUrl: string,
    private readonly project: string,
    private readonly authorization: string,
    private readonly apiVersion: string
  ) {}

  buildProjectUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, "");
    return `${this.orgUrl}/${this.project}/${cleanPath}`;
  }

  buildApiUrl(path: string, query?: Record<string, QueryValue>): string {
    const cleanPath = path.replace(/^\/+/, "");
    const url = new URL(`${this.orgUrl}/${this.project}/_apis/${cleanPath}`);
    url.searchParams.set("api-version", this.apiVersion);
    applyQuery(url, query);
    return url.toString();
  }

  async fetchByUrl(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers as Record<string, string>);
    headers.set("Authorization", this.authorization);
    return fetch(url, { ...init, headers });
  }

  async requestByUrl<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchByUrl(url, init);
    if (!response.ok) {
      throw new Error(`Azure DevOps API error ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  async tryRequestByUrl<T>(url: string, init?: RequestInit): Promise<T | null> {
    const response = await this.fetchByUrl(url, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  }

  async get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    return this.requestByUrl<T>(this.buildApiUrl(path, query));
  }

  async post<T>(path: string, body: unknown, query?: Record<string, QueryValue>): Promise<T> {
    const url = this.buildApiUrl(path, query);
    const headers = new Headers({ "Content-Type": "application/json" });
    return this.requestByUrl<T>(url, { method: "POST", headers, body: JSON.stringify(body) });
  }
}

export const adoClient = new AdoClient(ADO_ORG_URL, ADO_PROJECT, authHeader, ADO_API_VERSION);
