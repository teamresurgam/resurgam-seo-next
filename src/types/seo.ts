/**
 * SEO query parameters and Next.js-compatible metadata types.
 */

export interface SEOQueryParams {
  /**
   * WordPress post, page, product, or term ID.
   */
  id?: number;

  /**
   * WordPress post name / slug (e.g. "about-us", "storefronts-decay").
   */
  slug?: string;

  /**
   * Content type (e.g. "page", "post", "product", "case_study", "capability", "category").
   * Default: "post"
   */
  type?: string;

  /**
   * Frontend URL or relative path to resolve SEO data for (e.g. "/about-us" or "https://example.com/shop").
   */
  url?: string;

  /**
   * Alias for `url`.
   */
  path?: string;

  /**
   * Whether preview mode is requested for draft or revision content.
   */
  preview?: boolean;

  /**
   * HMAC preview token or API secret for preview access.
   */
  token?: string;
}

export interface FetchOptions {
  /**
   * Next.js cache revalidation time in seconds, or `false` for no-store.
   */
  revalidate?: number | false;

  /**
   * Next.js cache tags for on-demand revalidation.
   */
  tags?: string[];

  /**
   * Standard fetch cache mode.
   */
  cache?: 'force-cache' | 'no-store' | 'default' | 'reload' | 'no-cache';

  /**
   * Custom request headers.
   */
  headers?: Record<string, string>;

  /**
   * Optional custom AbortSignal for cancellation.
   */
  signal?: AbortSignal;
}

/**
 * Compatible shape for Next.js App Router Metadata return values.
 * Allows consumers to return generateSEOMetadata() directly from generateMetadata().
 */
export interface NextMetadata {
  title?: string | { default: string; template: string };
  description?: string;
  metadataBase?: URL;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
    nocache?: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      noimageindex?: boolean;
      'max-video-preview'?: number | string;
      'max-image-preview'?: 'none' | 'standard' | 'large';
      'max-snippet'?: number;
    };
  };
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    locale?: string;
    type?: string;
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    images?: string[];
    creator?: string;
    site?: string;
  };
  other?: Record<string, string | number | (string | number)[]>;
}

/**
 * Sitemap entry shape compatible with Next.js App Router app/sitemap.ts (MetadataRoute.Sitemap).
 */
export interface NextSitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
}

/**
 * Robots.txt configuration shape compatible with Next.js App Router app/robots.ts (MetadataRoute.Robots).
 */
export interface NextRobotsConfig {
  rules:
    | {
        userAgent?: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }
    | Array<{
        userAgent?: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }>;
  sitemap?: string | string[];
  host?: string;
}

