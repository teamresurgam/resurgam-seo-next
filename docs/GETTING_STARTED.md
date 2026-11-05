# Getting Started with `@resurgam/seo-next`

## 1. Installation

```bash
npm install @resurgam/seo-next
```

Or using pnpm / yarn:
```bash
pnpm add @resurgam/seo-next
# or
yarn add @resurgam/seo-next
```

## 2. Environment Configuration

Add the following variables to your `.env.local` file:

```env
# The URL where your WordPress backend is hosted
WORDPRESS_API_URL=https://cms.example.com

# Optional explicit SEO endpoint override (defaults to ${WORDPRESS_API_URL}/wp-json/resurgam-seo/v1)
RESURGAM_SEO_API_URL=https://cms.example.com/wp-json/resurgam-seo/v1

# The public canonical URL of your Next.js application
NEXT_PUBLIC_SITE_URL=https://www.example.com

# Optional API key for previewing unpublished/draft posts
RESURGAM_SEO_API_KEY=
```

## 3. Create the SEO Client Singleton

Create a file at `lib/seo.ts`:

```typescript
import { createResurgamSEO } from '@resurgam/seo-next';

export const seo = createResurgamSEO({
  wordpressUrl: process.env.WORDPRESS_API_URL!,
  apiUrl: process.env.RESURGAM_SEO_API_URL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
  apiKey: process.env.RESURGAM_SEO_API_KEY,
  defaultRevalidate: 3600, // 1 hour Next.js ISR cache
  trailingSlash: false,
});
```

## 4. Root Layout Setup (`app/layout.tsx`)

```tsx
import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

export async function generateMetadata(): Promise<Metadata> {
  return seo.generateMetadata({ url: '/' });
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSchema = await seo.getSchema({ url: '/' });

  return (
    <html lang="en">
      <head>
        <ResurgamJSONLD schema={siteSchema} id="resurgam-global-schema" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 5. Dynamic Page Router Setup (`app/[slug]/page.tsx`)

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo } from '@/lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return seo.generateMetadata({
    slug: params.slug,
    type: 'page',
  });
}

export default async function Page({ params }: Props) {
  const seoData = await seo.getMetadata({ slug: params.slug, type: 'page' });

  if (!seoData) {
    notFound();
  }

  return (
    <>
      <ResurgamJSONLD schema={seoData.schema} id={`schema-${params.slug}`} />
      <article>
        <h1>{seoData.title}</h1>
        <p>{seoData.description}</p>
      </article>
    </>
  );
}
```

## 6. Dynamic Sitemap (`app/sitemap.ts`)

```typescript
import { seo } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return seo.generateSitemap();
}
```

## 7. Dynamic Robots (`app/robots.ts`)

```typescript
import { seo } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return seo.generateRobots();
}
```
