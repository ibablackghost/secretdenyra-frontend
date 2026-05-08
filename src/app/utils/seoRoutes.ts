export const STATIC_SEO_ROUTES = [
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/account',
  '/wishlist',
];

export function buildSitemapXml(urls: string[], siteUrl: string) {
  const rows = urls
    .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
}

export function buildRobotsTxt(siteUrl: string) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
