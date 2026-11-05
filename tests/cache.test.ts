import { describe, it, expect } from 'vitest';
import {
  resurgamSeoTag,
  resurgamPostTag,
  resurgamSlugTag,
  resurgamSitemapTag,
  resolveFetchCacheOptions,
} from '../src/cache/cache';
import type { ResurgamSEOConfig } from '../src/types/config';

describe('Cache Helpers', () => {
  const config: ResurgamSEOConfig = {
    wordpressUrl: 'https://cms.example.com',
    siteUrl: 'https://www.example.com',
    defaultRevalidate: 1800,
    defaultTags: ['global-tag'],
  };

  it('generates predictable cache tags for entities', () => {
    expect(resurgamSeoTag()).toBe('resurgam-seo');
    expect(resurgamPostTag(42)).toBe('resurgam-post-42');
    expect(resurgamSlugTag('about-us')).toBe('resurgam-slug-about-us');
    expect(resurgamSitemapTag()).toBe('resurgam-sitemap');
  });

  it('resolves Next.js fetch cache options with revalidation and merged tags', () => {
    const opts = resolveFetchCacheOptions(config, { tags: ['custom-tag'] }, ['extra-tag']);
    expect(opts.next?.revalidate).toBe(1800);
    expect(opts.next?.tags).toContain('global-tag');
    expect(opts.next?.tags).toContain('custom-tag');
    expect(opts.next?.tags).toContain('extra-tag');
  });

  it('respects no-store override', () => {
    const opts = resolveFetchCacheOptions(config, { cache: 'no-store' });
    expect(opts.cache).toBe('no-store');
  });

  it('sets cache to no-store when revalidate is false or 0', () => {
    const opts = resolveFetchCacheOptions(config, { revalidate: false });
    expect(opts.cache).toBe('no-store');
  });
});
