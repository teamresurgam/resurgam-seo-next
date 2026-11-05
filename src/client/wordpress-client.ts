import type { ResurgamSEOConfig } from '../types/config';
import type { FetchOptions } from '../types/seo';
import type { WordPressConnectionTestResponse } from '../types/wordpress';
import { resolveFetchCacheOptions } from '../cache/cache';

export class WordPressAPIError extends Error {
  public status: number;
  public endpoint: string;
  public details?: unknown;

  constructor(message: string, status: number, endpoint: string, details?: unknown) {
    super(`[@resurgam/seo-next] WordPress API error (${status}) on ${endpoint}: ${message}`);
    this.name = 'WordPressAPIError';
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
  }
}

export class WordPressClient {
  private config: ResurgamSEOConfig;

  constructor(config: ResurgamSEOConfig) {
    this.config = config;
  }

  /**
   * Constructs the full URL for a given relative or absolute API path.
   */
  public resolveEndpointUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.apiUrl}${cleanPath}`;
  }

  /**
   * Internal fetch wrapper using the native Fetch API with timeout, Next.js cache options, and error handling.
   */
  public async fetch<T>(path: string, init: RequestInit = {}, options?: FetchOptions, extraTags: string[] = []): Promise<T> {
    const url = this.resolveEndpointUrl(path);

    // Merge headers
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.config.headers,
      ...options?.headers,
      ...(init.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers['X-Resurgam-Api-Key'] = this.config.apiKey;
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }
    }

    // Resolve Next.js cache parameters
    const cacheOpts = resolveFetchCacheOptions(this.config, options, extraTags);

    // Timeout signal handling
    const timeoutMs = this.config.timeoutMs || 8000;
    let signal = options?.signal || init.signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!signal) {
      if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
        signal = AbortSignal.timeout(timeoutMs);
      } else {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        signal = controller.signal;
      }
    }

    try {
      const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
        ...init,
        headers,
        signal,
        ...cacheOpts,
      };

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errBody: any = null;
        try {
          errBody = await response.json();
        } catch {
          try {
            errBody = await response.text();
          } catch {
            errBody = null;
          }
        }

        const errMsg =
          (errBody && typeof errBody === 'object' && (errBody.message || errBody.code)) ||
          response.statusText ||
          `HTTP ${response.status}`;

        throw new WordPressAPIError(String(errMsg), response.status, url, errBody);
      }

      const json = (await response.json()) as T;
      return json;
    } catch (err: any) {
      if (err instanceof WordPressAPIError) {
        throw err;
      }

      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        throw new WordPressAPIError(`Request timed out after ${timeoutMs}ms`, 408, url);
      }

      throw new WordPressAPIError(err.message || 'Unknown network error', 0, url, err);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Performs an HTTP GET request.
   */
  public async get<T>(path: string, options?: FetchOptions, extraTags: string[] = []): Promise<T> {
    return this.fetch<T>(path, { method: 'GET' }, options, extraTags);
  }

  /**
   * Performs an HTTP POST request.
   */
  public async post<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options
    );
  }

  /**
   * Tests the connection to the WordPress SEO REST API.
   */
  public async testConnection(): Promise<WordPressConnectionTestResponse> {
    try {
      return await this.post<WordPressConnectionTestResponse>('/test-connection', {
        url: this.config.siteUrl,
      });
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

