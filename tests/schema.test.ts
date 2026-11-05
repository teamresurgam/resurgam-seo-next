import { describe, it, expect } from 'vitest';
import {
  serializeJsonLd,
  deduplicateSchema,
  renderJsonLdString,
  ResurgamJSONLD,
} from '../src/schema/json-ld';

describe('Structured Data / JSON-LD', () => {
  it('safely serializes JSON-LD and escapes script tag injection vectors', () => {
    const malicious = {
      '@type': 'WebPage',
      name: 'Test Page</script><script>alert("XSS")</script>',
      description: 'Breakout & test > 1 < 2',
    };

    const serialized = serializeJsonLd(malicious);
    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003C/script\\u003E');
    expect(serialized).toContain('\\u003Cscript\\u003E');
    expect(serialized).toContain('\\u0026');
  });

  it('deduplicates identical schema nodes by @id', () => {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': 'https://example.com/#website', name: 'Example' },
        { '@type': 'WebSite', '@id': 'https://example.com/#website', name: 'Example Duplicate' },
        { '@type': 'Organization', '@id': 'https://example.com/#org', name: 'Example Org' },
      ],
    };

    const cleaned = deduplicateSchema(graph) as any;
    expect(cleaned['@graph'].length).toBe(2);
    expect(cleaned['@graph'][0].name).toBe('Example');
    expect(cleaned['@graph'][1].name).toBe('Example Org');
  });

  it('renders a valid HTML script tag using renderJsonLdString', () => {
    const validSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Resurgam Digital',
    };

    const html = renderJsonLdString(validSchema, { id: 'test-schema' });
    expect(html).toContain('<script type="application/ld+json" id="test-schema">');
    expect(html).toContain('Resurgam Digital');
    expect(html).toContain('</script>');
  });

  it('handles empty or null schema in ResurgamJSONLD component gracefully', async () => {
    expect(await ResurgamJSONLD({ schema: null })).toBeNull();
    expect(await ResurgamJSONLD({ schema: {} })).toBeNull();
  });
});
