import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', 
        '/profile/', 
        '/login',
        '/register',
      ],
    },
    // PERBAIKAN: Arahkan sitemap ke domain baru Anda
    sitemap: 'https://komiknet.site/sitemap.xml',
  }
}