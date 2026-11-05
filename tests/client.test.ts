import { describe, it, expect, vi } from 'vitest';
import { createResurgamSEO, ResurgamSEOClient } from '../src/client/seo-client';
import { WordPressAPIError } from '../src/client/wordpress-client';
import { ResurgamConfigurationError } from '../src/types/config';

describe('ResurgamSEOClient & Configuration', () => {
  it('throws ResurgamConfigurationError if wordpressUrl is missing', () => {
    expect(() => createResurgamSEO({ siteUrl: 'https://www.example.com' })).toThrow(
      ResurgamConfigurationError
    );
  });

  it('throws ResurgamConfigurationError if siteUrl is missing', () => {
    expect(() => createResurgamSEO({ wordpressUrl: 'https://cms.example.com' })).toThrow(
      ResurgamConfigurationError
    );
  });

  it('initializes successfully with valid configuration', () => {
    const seo = createResurgamSEO({
      wordpressUrl: 'https://cms.example.com',
      siteUrl: 'https://www.example.com',
    });

    expect(seo).toBeInstanceOf(ResurgamSEOClient);
    expect(seo.config.wordpressUrl).toBe('https://cms.example.com');
    expect(seo.config.apiUrl).toBe('https://cms.example.com/wp-json/resurgam-seo/v1');
    expect(seo.config.siteUrl).toBe('https://www.example.com');
  });

  it('handles 404 from WordPress by returning null without fabricating data', async () => {
    const seo = createResurgamSEO({
      wordpressUrl: 'https://cms.example.com',
      siteUrl: 'https://www.example.com',
    });

    vi.spyOn(seo.wpClient, 'get').mockRejectedValue(
      new WordPressAPIError('Content not found', 404, '/seo?slug=unknown')
    );

    const result = await seo.getMetadata({ slug: 'unknown' });
    expect(result).toBeNull();

    const meta = await seo.generateMetadata({ slug: 'unknown' });
    expect(meta.title).toBeUndefined();
    expect(meta.description).toBeUndefined();
    expect(meta.alternates).toBeUndefined();
  });

  it('throws descriptive WordPressAPIError on server failure (500) rather than silently returning fake metadata', async () => {
    const seo = createResurgamSEO({
      wordpressUrl: 'https://cms.example.com',
      siteUrl: 'https://www.example.com',
    });

    vi.spyOn(seo.wpClient, 'get').mockRejectedValue(
      new WordPressAPIError('Internal server error', 500, '/seo?slug=error-page')
    );

    await expect(seo.getMetadata({ slug: 'error-page' })).rejects.toThrow(WordPressAPIError);
    await expect(seo.generateMetadata({ slug: 'error-page' })).rejects.toThrow('Internal server error');
  });
});
