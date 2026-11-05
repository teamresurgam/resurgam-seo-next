import type { ResurgamSEOConfig } from '../types/config';
import type { NextRobotsConfig } from '../types/seo';

export interface GenerateRobotsOptions {
  /**
   * Additional paths to disallow for all user agents.
   * Default includes: ['/api/', '/_next/']
   */
  disallow?: string[];

  /**
   * Additional paths to allow.
   */
  allow?: string[];

  /**
   * Custom user agents configuration.
   */
  rules?: NextRobotsConfig['rules'];

  /**
   * Custom sitemap URL override.
   * Defaults to `${siteUrl}/sitemap.xml`.
   */
  sitemap?: string | string[];

  /**
   * Crawl delay in seconds.
   */
  crawlDelay?: number;
}

/**
 * Generates a robots.txt configuration object compatible with Next.js App Router app/robots.ts.
 *
 * Usage in `app/robots.ts`:
 * ```ts
 * import { seo } from '@/lib/seo';
 * import { MetadataRoute } from 'next';
 *
 * export default function robots(): MetadataRoute.Robots {
 *   return seo.generateRobots();
 * }
 * ```
 */
export function generateRobots(
  config: ResurgamSEOConfig,
  options?: GenerateRobotsOptions
): NextRobotsConfig {
  const siteUrl = config.siteUrl.replace(/\/+$/, '');
  const sitemapUrl = options?.sitemap || `${siteUrl}/sitemap.xml`;

  if (options?.rules) {
    return {
      rules: options.rules,
      sitemap: sitemapUrl,
      host: siteUrl,
    };
  }

  const disallowPaths = ['/api/', '/_next/'];
  if (options?.disallow && options.disallow.length > 0) {
    for (const p of options.disallow) {
      if (!disallowPaths.includes(p)) {
        disallowPaths.push(p);
      }
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: options?.allow || '/',
      disallow: disallowPaths,
      crawlDelay: options?.crawlDelay,
    },
    sitemap: sitemapUrl,
    host: siteUrl,
  };
}

