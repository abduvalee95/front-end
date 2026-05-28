import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/finance', '/students', '/teachers', '/groups', '/leads', '/reports', '/analytics', '/subjects', '/journal', '/attendance', '/schedule', '/settings', '/admin'],
      },
    ],
  };
}
