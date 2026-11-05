# Custom Post Types (CPT) Example

This directory demonstrates how to handle custom WordPress post types (such as `case_study`, `capability`, or `product`) in Next.js App Router using `@resurgam/seo-next`.

## Key Concepts

When querying custom post types, specify the `type` parameter alongside the `slug` or `url`:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return seo.generateMetadata({
    slug: params.slug,
    type: 'case_study',
    url: `/case-studies/${params.slug}`,
  });
}
```

The WordPress REST API resolves the post by type and slug, processes post meta, and returns the normalized schema, Open Graph, and Twitter metadata tailored to that custom content type.

