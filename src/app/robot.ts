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
    // Arahkan ke sitemap dengan domain Vercel Anda
    sitemap: 'https://komiknet.vercel.app/sitemap.xml',
  }
}