import { describe, it, expect } from 'vitest';
import { generateRobots } from '../src/robots/robots';
import type { ResurgamSEOConfig } from '../src/types/config';

describe('Robots.txt Generator', () => {
  const mockConfig: ResurgamSEOConfig = {
    wordpressUrl: 'https://cms.example.com',
    siteUrl: 'https://www.example.com',
  };

  it('generates standard robots.txt configuration with sitemap link', () => {
    const robots = generateRobots(mockConfig);

    expect(robots.host).toBe('https://www.example.com');
    expect(robots.sitemap).toBe('https://www.example.com/sitemap.xml');
    expect(robots.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
      crawlDelay: undefined,
    });
  });

  it('supports custom disallowed paths', () => {
    const robots = generateRobots(mockConfig, {
      disallow: ['/checkout', '/admin/'],
    });

    const disallowList = (robots.rules as any).disallow as string[];
    expect(disallowList).toContain('/checkout');
    expect(disallowList).toContain('/admin/');
    expect(disallowList).toContain('/api/');
  });

  it('supports custom rule sets', () => {
    const customRules = [
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'BadBot', disallow: '/' },
    ];

    const robots = generateRobots(mockConfig, {
      rules: customRules,
    });

    expect(robots.rules).toEqual(customRules);
  });
});
