# @resurgam/seo-next

> Standalone, production-ready Next.js App Router integration package for the Resurgam SEO WordPress plugin in headless commerce and headless CMS architectures.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@resurgam/seo-next)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-13.4%20%7C%2014%20%7C%2015-black.svg)](https://nextjs.org)

---

## Features

- ⚡ **Native Next.js Metadata API**: Maps WordPress titles, descriptions, Open Graph, Twitter cards, and robots directives directly to Next.js App Router `generateMetadata()`.
- 🌐 **Headless URL Rewriting**: Automatically rewrites internal WordPress origins (`https://cms.example.com`) to your public storefront domain (`https://www.example.com`).
- 🧩 **Server Component Structured Data**: `<ResurgamJSONLD />` Server Component renders valid Schema.org JSON-LD graphs with automatic XSS escape protection.
- 🗺️ **Dynamic Sitemaps**: `seo.generateSitemap()` exports directly to Next.js `app/sitemap.ts`.
- 🤖 **Dynamic Robots**: `seo.generateRobots()` exports directly to Next.js `app/robots.ts`.
- 🚀 **Granular Fetch Caching**: Full Next.js ISR integration with `revalidate` and tag-based on-demand invalidation (`tags: ['resurgam-seo', 'resurgam-post-123']`).
- 🛡️ **Zero Credential Exposure**: WordPress credentials remain private on your backend server.
- 📦 **Zero Extraneous Dependencies**: Built on TypeScript and native Fetch with optional peer dependencies for `next` and `react`.
- 🎯 **No Fabricated Fallbacks**: Exclusively renders actual SEO data configured in WordPress.

---

## Installation

```bash
npm install @resurgam/seo-next
```

---

## Configuration

Set environment variables in your `.env.local`:

```env
WORDPRESS_API_URL=https://cms.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
RESURGAM_SEO_API_KEY=your_optional_api_key
```

Create a client singleton in `lib/seo.ts`:

```typescript
import { createResurgamSEO } from '@resurgam/seo-next';

export const seo = createResurgamSEO({
  wordpressUrl: process.env.WORDPRESS_API_URL!,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
  apiKey: process.env.RESURGAM_SEO_API_KEY,
  defaultRevalidate: 3600,
  trailingSlash: false,
});
```

---

## Usage

### 1. Page Metadata (`app/[slug]/page.tsx`)

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo } from '@/lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return seo.generateMetadata({ slug: params.slug });
}

export default async function Page({ params }: Props) {
  const seoData = await seo.getMetadata({ slug: params.slug });

  if (!seoData) {
    notFound();
  }

  return (
    <>
      <ResurgamJSONLD schema={seoData.schema} />
      <main>
        <h1>{seoData.title}</h1>
        <p>{seoData.description}</p>
      </main>
    </>
  );
}
```

### 2. Dynamic Sitemap (`app/sitemap.ts`)

```typescript
import { seo } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return seo.generateSitemap();
}
```

### 3. Dynamic Robots (`app/robots.ts`)

```typescript
import { seo } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return seo.generateRobots();
}
```

---

## Documentation

- [API Reference](docs/API.md)
- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Getting Started Guide](docs/GETTING_STARTED.md)
- [Staging Integration Report](docs/STAGING_INTEGRATION_REPORT.md)

---

## Publishing

To publish to npm:

```bash
npm run build
npm test
npm publish --access public
```

---

## License

[MIT](LICENSE) © 2026 Resurgam Digital
