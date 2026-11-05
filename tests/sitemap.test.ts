import { describe, it, expect, vi } from 'vitest';
import { generateSitemap } from '../src/sitemap/sitemap';
import type { WordPressClient } from '../src/client/wordpress-client';
import type { ResurgamSEOConfig } from '../src/types/config';

describe('Sitemap Generator', () => {
  const mockConfig: ResurgamSEOConfig = {
    wordpressUrl: 'https://cms.example.com',
    siteUrl: 'https://www.example.com',
    trailingSlash: false,
  };

  it('transforms WordPress sitemap items into Next.js Sitemap entries with frontend URLs', async () => {
    const mockWpClient = {
      get: vi.fn().mockResolvedValue({
        success: true,
        page: 1,
        per_page: 100,
        total: 2,
        total_pages: 1,
        items: [
          {
            id: 112859,
            type: 'page',
            slug: 'about-us',
            url: 'https://cms.example.com/about-us/',
            modified_at: '2026-10-20T13:27:05+05:30',
            changefreq: 'weekly',
            priority: '0.8',
          },
          {
            id: 113015,
            type: 'page',
            slug: 'case-studies',
            url: 'https://cms.example.com/case-studies/',
            modified_at: '2026-10-16T14:16:10+05:30',
            changefreq: 'monthly',
            priority: '0.6',
          },
        ],
      }),
    } as unknown as WordPressClient;

    const entries = await generateSitemap(mockWpClient, mockConfig);

    expect(entries.length).toBe(2);
    expect(entries[0].url).toBe('https://www.example.com/about-us');
    expect(entries[0].changeFrequency).toBe('weekly');
    expect(entries[0].priority).toBe(0.8);
    expect(entries[1].url).toBe('https://www.example.com/case-studies');
  });

  it('includes additional custom entries if provided', async () => {
    const mockWpClient = {
      get: vi.fn().mockResolvedValue({
        success: true,
        page: 1,
        total_pages: 1,
        items: [],
      }),
    } as unknown as WordPressClient;

    const entries = await generateSitemap(mockWpClient, mockConfig, {
      additionalEntries: [
        {
          url: 'https://www.example.com/custom-page',
          lastModified: new Date('2026-11-01'),
          changeFrequency: 'daily',
          priority: 1.0,
        },
      ],
    });

    expect(entries.length).toBe(1);
    expect(entries[0].url).toBe('https://www.example.com/custom-page');
    expect(entries[0].priority).toBe(1.0);
  });

  it('throws descriptive error when WordPress sitemap request fails without fabricating fake entries', async () => {
    const mockWpClient = {
      get: vi.fn().mockRejectedValue(new Error('WordPress sitemap unavailable')),
    } as unknown as WordPressClient;

    await expect(generateSitemap(mockWpClient, mockConfig)).rejects.toThrow(
      'WordPress sitemap unavailable'
    );
  });
});
