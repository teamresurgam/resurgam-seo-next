import { describe, it, expect } from 'vitest';
import { resolveCanonicalUrl } from '../src/metadata/canonical';

describe('resolveCanonicalUrl', () => {
  it('rewrites WordPress origin to public storefront siteUrl', () => {
    const raw = 'https://cms.example.com/about-us/';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
    });
    expect(result).toBe('https://www.example.com/about-us/');
  });

  it('enforces trailing slash when configured', () => {
    const raw = 'https://cms.example.com/about-us';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
      trailingSlash: true,
    });
    expect(result).toBe('https://www.example.com/about-us/');
  });

  it('removes trailing slash when configured as false', () => {
    const raw = 'https://cms.example.com/about-us/';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
      trailingSlash: false,
    });
    expect(result).toBe('https://www.example.com/about-us');
  });

  it('does not append trailing slash to static file extensions', () => {
    const raw = 'https://cms.example.com/sitemap.xml';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
      trailingSlash: true,
    });
    expect(result).toBe('https://www.example.com/sitemap.xml');
  });

  it('handles relative paths properly', () => {
    const raw = '/shop/organic-turmeric';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
      trailingSlash: false,
    });
    expect(result).toBe('https://www.example.com/shop/organic-turmeric');
  });

  it('returns undefined when raw canonical is empty or undefined without fabricating fallback', () => {
    expect(resolveCanonicalUrl(undefined, { siteUrl: 'https://www.example.com' })).toBeUndefined();
    expect(resolveCanonicalUrl('', { siteUrl: 'https://www.example.com' })).toBeUndefined();
    expect(resolveCanonicalUrl('   ', { siteUrl: 'https://www.example.com' })).toBeUndefined();
  });

  it('preserves query strings', () => {
    const raw = 'https://cms.example.com/shop?sort=desc';
    const result = resolveCanonicalUrl(raw, {
      siteUrl: 'https://www.example.com',
      trailingSlash: false,
    });
    expect(result).toBe('https://www.example.com/shop?sort=desc');
  });
});
