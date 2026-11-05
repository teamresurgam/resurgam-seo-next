# Next.js App Router Integration Example

This example demonstrates how to integrate `@resurgam/seo-next` into a modern Next.js App Router application.

## Directory Structure

```text
app-router/
├── app/
│   ├── layout.tsx       # Root layout with global metadata & Organization/WebSite JSON-LD
│   ├── page.tsx         # Static/SSR homepage metadata & schema
│   ├── [slug]/
│   │   └── page.tsx     # Dynamic page/post metadata generation
│   ├── sitemap.ts       # Dynamic App Router sitemap.xml
│   └── robots.ts        # Dynamic App Router robots.txt
├── lib/
│   └── seo.ts           # Resurgam SEO Client singleton
└── README.md
```

## Setup

1. Configure your `.env.local`:
   ```env
   WORDPRESS_API_URL=https://cms.example.com
   NEXT_PUBLIC_SITE_URL=https://www.example.com
   ```

2. Export metadata from any server component:
   ```typescript
   import { seo } from '@/lib/seo';
   import type { Metadata } from 'next';

   export async function generateMetadata({ params }): Promise<Metadata> {
     return seo.generateMetadata({ slug: params.slug });
   }
   ```

3. Render structured data:
   ```tsx
   import { ResurgamJSONLD } from '@resurgam/seo-next';

   export default async function Page({ params }) {
     const schema = await seo.getSchema({ slug: params.slug });
     return (
       <>
         <ResurgamJSONLD schema={schema} />
         {/* page content */}
       </>
     );
   }
   ```

