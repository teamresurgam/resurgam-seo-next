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
import { resolveCanonicalUrl } from '../metadata/canonical';
import { rewriteSchemaOrigins } from '../schema/json-ld';
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
      return { url: trimmed, path: trimmed };
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
   * Returns `null` when the requested content does not exist in WordPress (404),
   * unless options.fallback is provided, in which case fallback SEO data is synthesized.
   */
  public async getMetadata(
    queryOrId: SEOQueryParams | string | number,
    options?: FetchOptions & {
      fallback?: {
        title?: string;
        description?: string;
        type?: string;
      };
    }
  ): Promise<WordPressSEOData | null> {
    const query = normalizeQuery(queryOrId);
    let seoData: WordPressSEOData | null = null;
    try {
      seoData = await this.fetchMetadataFromWp(query, options);
    } catch (err: any) {
      if (options?.fallback) {
        seoData = null;
      } else {
        throw err;
      }
    }

    if (!seoData && options?.fallback) {
      return this.buildFallbackSEOData(query, options.fallback);
    }

    if (seoData && options?.fallback) {
      if ((!seoData.description || !seoData.description.trim()) && options.fallback.description) {
        seoData.description = options.fallback.description;
      }
      if ((!seoData.title || !seoData.title.trim()) && options.fallback.title) {
        seoData.title = options.fallback.title;
      }
      if (!seoData.schema) {
        seoData.schema = this.buildFallbackSchema(query, options.fallback);
      }
    }

    return seoData;
  }

  private async fetchMetadataFromWp(
    query: SEOQueryParams,
    options?: FetchOptions
  ): Promise<WordPressSEOData | null> {
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
        return this.normalizeSEOData(response.data);
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
            return this.normalizeSEOData(altRes.data);
          }
        } catch (altErr: any) {
          if (altErr.status === 404) {
            return null;
          }
          throw altErr;
        }
      }

      // Check if this was a request for the site homepage (which returns 404 when page_on_front is not set)
      const isHome = !query.id && (!query.path || query.path === '/' || query.path === '') && (!query.slug || query.slug === 'home' || query.slug === 'homepage') && (!query.url || query.url === '/');
      if (isHome && err.status === 404) {
        try {
          return await this.getHomeMetadata(options);
        } catch {
          return null;
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

  private buildFallbackSEOData(
    query: SEOQueryParams,
    fallback: { title?: string; description?: string; type?: string }
  ): WordPressSEOData {
    const targetPath = query.path || query.url || `/${query.slug || ''}`;
    const siteUrl = this.config.siteUrl.replace(/\/+$/, '');
    const canonical = resolveCanonicalUrl(targetPath, {
      siteUrl: this.config.siteUrl,
      trailingSlash: this.config.trailingSlash,
    }) || `${siteUrl}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
    const title = fallback.title || '';
    const description = fallback.description || '';
    const siteName = this.config.siteName || 'Resurgam Digital';
    const contentType = fallback.type || query.type || 'page';

    return {
      object_id: 0,
      title,
      description,
      canonical_url: canonical,
      canonical,
      content_type: contentType,
      slug: query.slug || targetPath.replace(/^\/|\/$/g, ''),
      status: 'publish',
      robots: {
        index: true,
        follow: true,
        max_image_preview: 'large',
        max_snippet: -1,
        max_video_preview: -1,
      },
      open_graph: {
        title,
        description,
        url: canonical,
        type: 'website',
        site_name: siteName,
        locale: 'en-US',
        image: this.config.defaultOgImage
          ? {
              url: this.config.defaultOgImage,
              width: 1200,
              height: 630,
              alt: title,
            }
          : null,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: this.config.defaultOgImage || '',
      },
      breadcrumbs: [
        { name: 'Home', url: `${siteUrl}/` },
        { name: title, url: canonical },
      ],
      schema: this.buildFallbackSchema(query, fallback),
      timestamps: {
        published_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
      },
      preview: {
        is_preview: false,
        status: 'publish',
      },
    };
  }

  private buildFallbackSchema(
    query: SEOQueryParams,
    fallback: { title?: string; description?: string }
  ): any {
    const targetPath = query.path || query.url || `/${query.slug || ''}`;
    const siteUrl = this.config.siteUrl.replace(/\/+$/, '');
    const canonical = resolveCanonicalUrl(targetPath, {
      siteUrl: this.config.siteUrl,
      trailingSlash: this.config.trailingSlash,
    }) || `${siteUrl}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
    const title = fallback.title || '';
    const description = fallback.description || '';
    const siteName = this.config.siteName || 'Resurgam Digital';

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: siteName,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: siteName,
          url: `${siteUrl}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${this.config.wordpressUrl}/wp-content/uploads/2026/11/logo_main-scaled.png`,
          },
        },
        {
          '@type': 'WebPage',
          '@id': `${canonical}#webpage`,
          url: canonical,
          name: title,
          description: description,
          isPartOf: { '@id': `${siteUrl}/#website` },
          breadcrumb: { '@id': `${canonical}#breadcrumb` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonical}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${siteUrl}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: title,
              item: canonical,
            },
          ],
        },
      ],
    };
  }

  /**
   * Normalizes returned WordPress SEO data: rewrites origins in schema and breadcrumbs.
   */
  private normalizeSEOData(data: WordPressSEOData): WordPressSEOData {
    if (!data) return data;

    const schema = data.schema
      ? (rewriteSchemaOrigins(data.schema, {
          siteUrl: this.config.siteUrl,
          wordpressUrl: this.config.wordpressUrl,
          urlMappings: this.config.urlMappings,
        }) as Record<string, unknown>)
      : data.schema;

    const breadcrumbs = Array.isArray(data.breadcrumbs)
      ? data.breadcrumbs.map((b) => {
          let url = b.url;
          if (url) {
            const cleanSite = this.config.siteUrl.replace(/\/+$/, '');
            url = url
              .replace(/https?:\/\/(?:api|staging)\.resurgam\.digital/g, cleanSite)
              .replace(new RegExp(`^${this.config.wordpressUrl.replace(/\/+$/, '')}`, 'g'), cleanSite);
          }
          return { ...b, url };
        })
      : data.breadcrumbs;

    return {
      ...data,
      schema: schema as any,
      breadcrumbs,
    };
  }

  /**
   * Fallback homepage metadata generator reading directly from WordPress site-settings / root endpoint.
   */
  public async getHomeMetadata(options?: FetchOptions): Promise<WordPressSEOData | null> {
    try {
      const siteSettingsUrl = `${this.config.wordpressUrl}/wp-json/resurgam/v1/site-settings`;
      let siteName = 'Resurgam Digital';
      let tagline = 'D2C Growth Studio';

      try {
        const res = await fetch(siteSettingsUrl, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.branding?.name) siteName = json.data.branding.name;
          if (json?.data?.branding?.tagline) tagline = json.data.branding.tagline;
        }
      } catch {
        // use defaults
      }

      const title = `${siteName} — ${tagline}`;
      const description = 'Resurgam Digital is an independent studio building intelligent commerce, brand, and digital experiences.';
      const siteUrl = this.config.siteUrl.replace(/\/+$/, '');
      const canonical = `${siteUrl}/`;

      const homeData: WordPressSEOData = {
        object_id: 0,
        content_type: 'page',
        slug: '',
        status: 'publish',
        canonical_url: canonical,
        title,
        description,
        canonical,
        robots: {
          index: true,
          follow: true,
          max_snippet: -1,
          max_image_preview: 'large',
          max_video_preview: -1,
          noarchive: false,
          nosnippet: false,
        },
        open_graph: {
          title,
          description,
          url: canonical,
          type: 'website',
          site_name: siteName,
          locale: 'en_US',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          image: '',
        },
        schema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              url: `${siteUrl}/`,
              name: siteName,
              description: tagline,
              publisher: { '@id': `${siteUrl}/#organization` },
            },
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              name: siteName,
              url: `${siteUrl}/`,
              logo: {
                '@type': 'ImageObject',
                url: `${this.config.wordpressUrl}/wp-content/uploads/2026/11/logo_main-scaled.png`,
              },
            },
          ],
        } as any,
        breadcrumbs: [
          { name: 'Home', url: `${siteUrl}/` },
        ],
        timestamps: {
          published_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
        },
        preview: {
          is_preview: false,
          status: 'publish',
        },
      };

      return homeData;
    } catch {
      return null;
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
    options?: FetchOptions & { fallback?: Partial<NextMetadata> }
  ): Promise<NextMetadata> {
    const query = normalizeQuery(queryOrId);
    const fallbackTitle = typeof options?.fallback?.title === 'string'
      ? options.fallback.title
      : (options?.fallback?.title as any)?.default;
    const fallbackDescription = options?.fallback?.description || '';

    let seoData: WordPressSEOData | null = null;
    try {
      seoData = await this.getMetadata(query, {
        ...options,
        fallback: options?.fallback
          ? {
              title: fallbackTitle,
              description: fallbackDescription,
            }
          : undefined,
      });
    } catch (err: any) {
      if (options?.fallback) {
        seoData = null;
      } else {
        throw err;
      }
    }
    const mapped = mapToNextMetadata(seoData, this.config, query);

    if (options?.fallback) {
      const fallback = options.fallback;
      const targetPath = query.path || query.url || `/${query.slug || ''}`;
      const canonical = resolveCanonicalUrl(targetPath, {
        siteUrl: this.config.siteUrl,
        trailingSlash: this.config.trailingSlash,
      });

      return {
        metadataBase: mapped.metadataBase || new URL(this.config.siteUrl),
        title: mapped.title || fallback.title,
        description: mapped.description || fallback.description,
        alternates: mapped.alternates?.canonical ? mapped.alternates : (canonical ? { canonical } : undefined),
        robots: mapped.robots || fallback.robots || { index: true, follow: true },
        openGraph: {
          url: mapped.openGraph?.url || (fallback.openGraph as any)?.url || canonical,
          type: (mapped.openGraph?.type as any) || (fallback.openGraph as any)?.type || 'website',
          siteName: mapped.openGraph?.siteName || (fallback.openGraph as any)?.siteName || this.config.siteName || 'Resurgam Digital',
          title: mapped.openGraph?.title || (fallback.openGraph as any)?.title || fallbackTitle || mapped.title,
          description: mapped.openGraph?.description || (fallback.openGraph as any)?.description || fallback.description || mapped.description,
          images: mapped.openGraph?.images || (fallback.openGraph as any)?.images || (this.config.defaultOgImage ? [{ url: this.config.defaultOgImage }] : undefined),
        },
        twitter: {
          card: mapped.twitter?.card || fallback.twitter?.card || 'summary_large_image',
          title: mapped.twitter?.title || (fallback.twitter as any)?.title || fallbackTitle || mapped.title,
          description: mapped.twitter?.description || (fallback.twitter as any)?.description || fallback.description || mapped.description,
          images: mapped.twitter?.images || (fallback.twitter as any)?.images || (this.config.defaultOgImage ? [this.config.defaultOgImage] : undefined),
        },
      };
    }

    return mapped;
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
