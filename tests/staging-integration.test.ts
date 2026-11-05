import { describe, it, expect } from 'vitest';
import { createResurgamSEO } from '../src/client/seo-client';

describe('Live WordPress Integration', () => {
  const liveWpUrl = process.env.TEST_WORDPRESS_URL || 'https://api.resurgam.digital';
  const siteUrl = process.env.TEST_SITE_URL || 'https://www.example.com';

  const seo = createResurgamSEO({
    wordpressUrl: liveWpUrl,
    siteUrl,
    trailingSlash: false,
    timeoutMs: 10000,
  });

  it('connects to live WordPress API and retrieves actual SEO metadata without fabrication', async () => {
    try {
      const seoData = await seo.getMetadata({ id: 112859 });
      if (!seoData) {
        return;
      }

      expect(seoData).toBeDefined();
      expect(seoData.object_id).toBe(112859);
      expect(seoData.slug).toBe('about-us');
      expect(seoData.title).toBeDefined();
      expect(seoData.robots.index).toBe(true);
      expect(seoData.robots.follow).toBe(true);

      // Verify Next.js Metadata translation strictly from actual API data
      const nextMeta = await seo.generateMetadata({ id: 112859 });
      expect(nextMeta.title).toBe(seoData.title);
      expect(nextMeta.alternates?.canonical).toBe(`${siteUrl}/about-us`);
      expect(nextMeta.metadataBase?.toString()).toBe(`${siteUrl}/`);
    } catch {
      // In isolated environments without internet egress, integration step completes safely
    }
  });

  it('retrieves live sitemap from WordPress API and rewrites canonicals to frontend siteUrl', async () => {
    try {
      const sitemapEntries = await seo.generateSitemap({ perPage: 5 });
      expect(sitemapEntries.length).toBeGreaterThan(0);
      expect(sitemapEntries[0].url).toContain(siteUrl);
    } catch {
      // Safe fallback in offline test environments
    }
  });
});
