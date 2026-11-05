# Changelog

All notable changes to `@resurgam/seo-next` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-05

### Added
- Initial production release of `@resurgam/seo-next`.
- Native Next.js App Router metadata generation (`generateSEOMetadata` and `seo.generateMetadata`).
- WordPress REST API client for Resurgam SEO endpoints (`/wp-json/resurgam-seo/v1/seo`, `/metadata/{id}`, `/sitemap`, `/preview`).
- Metadata mapping for Title, Meta Description, Canonical URLs, Robots directives, Open Graph, and Twitter Cards.
- Structured data / JSON-LD generator and safe `<ResurgamJSONLD />` React Server Component.
- Dynamic Next.js App Router Sitemap generator (`seo.generateSitemap()` for `app/sitemap.ts`).
- Dynamic Next.js App Router Robots generator (`seo.generateRobots()` for `app/robots.ts`).
- Granular fetch caching with Next.js tags, revalidation, and on-demand cache tag helpers.
- Full TypeScript types reflecting WordPress REST response schema.
- Comprehensive test suite and examples for standard pages and custom post types (case studies, capabilities).

