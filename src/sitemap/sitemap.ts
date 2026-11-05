import type { WordPressClient } from '../client/wordpress-client';
import type { ResurgamSEOConfig } from '../types/config';
import type { FetchOptions, NextSitemapEntry } from '../types/seo';
import type { WordPressSitemapResponse } from '../types/wordpress';
import { resolveCanonicalUrl } from '../metadata/canonical';
import { resurgamSitemapTag } from '../cache/cache';

export interface GenerateSitemapOptions extends FetchOptions {
  /**
   * Post type to filter (e.g. "page", "post", "case_study", "all").
   * Default: "all"
   */
  type?: string;

  /**
   * Number of items per page when requesting WordPress sitemap feed.
   * Default: 100
   */
  perPage?: number;

  /**
   * Maximum total pages of sitemap feed to consume.
   * Default: 10
   */
  maxPages?: number;

  /**
   * Additional static or custom routes to prepend or append to the sitemap.
   */
  additionalEntries?: NextSitemapEntry[];
}

/**
 * Fetches and transforms WordPress sitemap items into Next.js App Router sitemap entries.
 *
 * All URLs are strictly rewritten from actual WordPress sitemap data to the public frontend `siteUrl`.
 * Never invents or fabricates fallback sitemap entries upon API failure.
 *
 * Usage in `app/sitemap.ts`:
 * ```ts
 * import { seo } from '@/lib/seo';
 * import type { MetadataRoute } from 'next';
 *
 * export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 *   return seo.generateSitemap();
 * }
 * ```
 */
export async function generateSitemap(
  client: WordPressClient,
  config: ResurgamSEOConfig,
  options?: GenerateSitemapOptions
): Promise<NextSitemapEntry[]> {
  const perPage = options?.perPage || 100;
  const maxPages = options?.maxPages || 10;
  const type = options?.type || 'all';

  const sitemapEntries: NextSitemapEntry[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const endpoint = `/sitemap?page=${currentPage}&per_page=${perPage}&type=${encodeURIComponent(type)}`;
    const response = await client.get<WordPressSitemapResponse>(
      endpoint,
      options,
      [resurgamSitemapTag()]
    );

    if (response && response.items && Array.isArray(response.items)) {
      for (const item of response.items) {
        if (!item.url) continue;

        const frontendUrl = resolveCanonicalUrl(item.url, {
          siteUrl: config.siteUrl,
          trailingSlash: config.trailingSlash,
        });

        if (!frontendUrl) continue;

        let lastMod: Date | string = item.modified_at;
        try {
          const parsedDate = new Date(item.modified_at);
          if (!isNaN(parsedDate.getTime())) {
            lastMod = parsedDate;
          }
        } catch {
          lastMod = item.modified_at;
        }

        const priorityNum = item.priority ? parseFloat(item.priority) : 0.7;

        sitemapEntries.push({
          url: frontendUrl,
          lastModified: lastMod,
          changeFrequency: item.changefreq || 'weekly',
          priority: isNaN(priorityNum) ? 0.7 : priorityNum,
        });
      }

      totalPages = response.total_pages || 1;
    } else {
      break;
    }

    currentPage++;
  } while (currentPage <= totalPages && currentPage <= maxPages);

  if (options?.additionalEntries && options.additionalEntries.length > 0) {
    sitemapEntries.push(...options.additionalEntries);
  }

  return sitemapEntries;
}
