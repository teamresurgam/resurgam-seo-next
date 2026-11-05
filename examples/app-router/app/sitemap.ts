import type { MetadataRoute } from 'next';
import { seo } from '../lib/seo';

/**
 * Dynamic Next.js App Router sitemap generation.
 *
 * Automatically pulls published pages and posts from WordPress and rewrites
 * canonical targets to the public frontend URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.example.com';

  return seo.generateSitemap({
    type: 'all',
    perPage: 100,
    additionalEntries: [
      {
        url: `${siteUrl.replace(/\/+$/, '')}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ],
  });
}
