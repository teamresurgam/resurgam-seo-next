import type { ResurgamSEOConfig } from '../types/config';
import { validateConfig } from '../types/config';
import type {
  FetchOptions,
  NextMetadata,
  NextRobotsConfig,
  NextSitemapEntry,
  SEOQueryParams,
} from '../types/seo';
import type {
  WordPressConnectionTestResponse,
  WordPressSEOData,
  WordPressSEOResponse,
} from '../types/wordpress';
import { WordPressClient, WordPressAPIError } from './wordpress-client';
import { mapToNextMetadata } from '../metadata/generate-seo-metadata';
import { generateSitemap, type GenerateSitemapOptions } from '../sitemap/sitemap';
import { generateRobots, type GenerateRobotsOptions } from '../robots/robots';
import { resurgamPostTag, resurgamSlugTag } from '../cache/cache';

/**
 * Normalizes user identifier input (number ID, string slug/path, or query object) into SEOQueryParams.
 */
function normalizeQuery(input: SEOQueryParams | string | number): SEOQueryParams {
  if (typeof input === 'number') {
    return { id: input };
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { url: trimmed };
    }
    // Numeric string check
    if (/^\d+$/.test(trimmed)) {
      return { id: parseInt(trimmed, 10) };
    }
    return { slug: trimmed };
  }
  return input || {};
}

/**
 * Resurgam SEO Client for Next.js App Router applications.
 */
export class ResurgamSEOClient {
  public readonly config: ResurgamSEOConfig;
  public readonly wpClient: WordPressClient;

  constructor(config: unknown) {
    this.config = validateConfig(config);
    this.wpClient = new WordPressClient(this.config);
  }

  /**
   * Fetches raw normalized SEO data from the WordPress REST API.
   *
   * Returns `null` only when the requested content does not exist in WordPress (404).
   * For network errors or server failures, throws a descriptive WordPressAPIError.
   */
  public async getMetadata(
    queryOrId: SEOQueryParams | string | number,
    options?: FetchOptions
  ): Promise<WordPressSEOData | null> {
    const query = normalizeQuery(queryOrId);
    const extraTags: string[] = [];

    let path = '/seo';
    const params = new URLSearchParams();

    if (query.id) {
      extraTags.push(resurgamPostTag(query.id));
      path = `/metadata/${query.id}`;
      if (query.preview) params.set('preview', '1');
      if (query.token) params.set('token', query.token);
    } else {
      if (query.slug) {
        params.set('slug', query.slug);
        extraTags.push(resurgamSlugTag(query.slug));
      }
      if (query.type) params.set('type', query.type);
      if (query.url) params.set('url', query.url);
      if (query.path) params.set('path', query.path);
      if (query.preview) params.set('preview', '1');
      if (query.token) params.set('token', query.token);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${path}?${queryString}` : path;

    try {
      const response = await this.wpClient.get<WordPressSEOResponse>(endpoint, options, extraTags);
      if (response && response.success && response.data) {
        return response.data;
      }
      throw new WordPressAPIError('Invalid API response: missing success or data field', 502, endpoint, response);
    } catch (err: any) {
      // If /metadata/{id} returns 404 on older plugin versions, attempt /seo?id={id}
      if (query.id && err.status === 404 && path.startsWith('/metadata/')) {
        try {
          params.set('id', String(query.id));
          const altEndpoint = `/seo?${params.toString()}`;
          const altRes = await this.wpClient.get<WordPressSEOResponse>(altEndpoint, options, extraTags);
          if (altRes && altRes.success && altRes.data) {
            return altRes.data;
          }
        } catch (altErr: any) {
          if (altErr.status === 404) {
            return null;
          }
          throw altErr;
        }
      }

      // If content was not found (404), return null so consumers can call notFound()
      if (err.status === 404) {
        return null;
      }

      // Re-throw server, network, and validation errors with descriptive details
      throw err;
    }
  }

  /**
   * Generates Next.js App Router Metadata for generateMetadata() exports.
   *
   * Example:
   * ```ts
   * export async function generateMetadata({ params }): Promise<Metadata> {
   *   return seo.generateMetadata({ slug: params.slug });
   * }
   * ```
   */
  public async generateMetadata(
    queryOrId: SEOQueryParams | string | number,
    options?: FetchOptions
  ): Promise<NextMetadata> {
    const query = normalizeQuery(queryOrId);
    const seoData = await this.getMetadata(query, options);
    return mapToNextMetadata(seoData, this.config);
  }

  /**
   * Retrieves the JSON-LD schema graph for structured data injection.
   *
   * Example:
   * ```tsx
   * const schema = await seo.getSchema({ slug: 'about-us' });
   * return <ResurgamJSONLD schema={schema} />;
   * ```
   */
  public async getSchema(
    queryOrId: SEOQueryParams | string | number,
    options?: FetchOptions
  ): Promise<Record<string, unknown> | null> {
    const seoData = await this.getMetadata(queryOrId, options);
    if (!seoData || !seoData.schema) {
      return null;
    }
    return seoData.schema as Record<string, unknown>;
  }

  /**
   * Generates sitemap entries compatible with Next.js App Router app/sitemap.ts.
   */
  public async generateSitemap(options?: GenerateSitemapOptions): Promise<NextSitemapEntry[]> {
    return generateSitemap(this.wpClient, this.config, options);
  }

  /**
   * Generates robots.txt rules compatible with Next.js App Router app/robots.ts.
   */
  public generateRobots(options?: GenerateRobotsOptions): NextRobotsConfig {
    return generateRobots(this.config, options);
  }

  /**
   * Direct draft preview fetcher using secure token.
   */
  public async getPreview(
    id: number,
    token: string,
    options?: FetchOptions
  ): Promise<WordPressSEOData | null> {
    const endpoint = `/preview?id=${id}&token=${encodeURIComponent(token)}`;
    const response = await this.wpClient.get<WordPressSEOResponse>(endpoint, {
      ...options,
      cache: 'no-store',
    });
    if (response && response.success && response.data) {
      return response.data;
    }
    return null;
  }

  /**
   * Connectivity test diagnostic.
   */
  public async testConnection(): Promise<WordPressConnectionTestResponse> {
    return this.wpClient.testConnection();
  }
}

/**
 * Creates and initializes a new ResurgamSEOClient instance.
 */
export function createResurgamSEO(config: unknown): ResurgamSEOClient {
  return new ResurgamSEOClient(config);
}

/**
 * Convenience standalone metadata generator.
 */
export async function generateSEOMetadata(
  identifier: string | number | SEOQueryParams,
  client?: ResurgamSEOClient
): Promise<NextMetadata> {
  if (!client) {
    throw new Error(
      '[@resurgam/seo-next] generateSEOMetadata requires a configured ResurgamSEOClient instance as second argument when called standalone.'
    );
  }
  return client.generateMetadata(identifier);
}
