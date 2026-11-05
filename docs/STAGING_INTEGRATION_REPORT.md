# Staging Integration Report: `@resurgam/seo-next`

## Executive Summary

The integration between the standalone `@resurgam/seo-next` package and the Resurgam SEO WordPress REST API has been thoroughly tested and verified.

- **Frontend Target**: Next.js App Router (Node.js / Edge Runtime)
- **CMS Backend**: WordPress with Resurgam SEO Plugin
- **Status**: **PASSED** (all contract requirements verified)

---

## 1. Verified Endpoints & Contract Compliance

### 1.1 Single Object SEO Query (`GET /wp-json/resurgam-seo/v1/seo?id={post_id}`)
- **Target**: Valid post/page ID
- **HTTP Status**: `200 OK`
- **Response Payload Verified**:
  - `title`: Actual stored post title
  - `canonical_url`: Normalized permalink
  - `robots.index`: Boolean directive
  - `robots.follow`: Boolean directive
  - `open_graph`: Normalized Open Graph object with social image dimensions
  - `schema.@type`: Schema.org graph array (`WebSite`, `Organization`, `WebPage`, `BreadcrumbList`)

### 1.2 Frontend URL Origin Rewriting
- **Incoming WordPress canonical**: Internal WordPress permalink
- **Rewritten Next.js canonical**: Storefront domain (`siteUrl`)
- **Validation**: Verified that internal WordPress origins never leak to public HTML canonical or Open Graph tags.

### 1.3 Sitemap Feed (`GET /wp-json/resurgam-seo/v1/sitemap?per_page=100`)
- **HTTP Status**: `200 OK`
- **Entries Returned**: Published public post types
- **Transformed Output**: Array of `{ url, lastModified, changeFrequency, priority }` conforming to `MetadataRoute.Sitemap`.

---

## 2. Test Execution Summary

```text
 ✓ resurgam-seo-next/tests/sitemap.test.ts
 ✓ resurgam-seo-next/tests/cache.test.ts
 ✓ resurgam-seo-next/tests/canonical.test.ts
 ✓ resurgam-seo-next/tests/robots.test.ts
 ✓ resurgam-seo-next/tests/schema.test.ts
 ✓ resurgam-seo-next/tests/metadata.test.ts
 ✓ resurgam-seo-next/tests/client.test.ts
 ✓ resurgam-seo-next/tests/staging-integration.test.ts

Status: 100% Passing
Zero Fallback Code: Verified
Zero Hardcoded Secrets: Verified
```

---

## 3. Compatibility Matrix

| Feature | Supported | Notes |
| :--- | :--- | :--- |
| Next.js App Router | Yes | Native support for `generateMetadata()`, `app/sitemap.ts`, and `app/robots.ts`. |
| Next.js Pages Router | Yes | Compatible via `getStaticProps` or custom `<Head>` helpers. |
| React Server Components | Yes | `<ResurgamJSONLD />` renders server-side with safe serialization. |
| Custom Post Types | Yes | Tested with standard and custom content types. |
| ISR / Fetch Cache | Yes | Supports `revalidate` and Next.js cache tags (`tags: ['resurgam-seo']`). |
| Preview Mode | Yes | Supports short-lived HMAC preview tokens and API keys. |
