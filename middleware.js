// middleware.js — Vercel Routing Middleware (solo rutas de documento).
// Copia el país del visitante a la cookie de sesión rl_geo; el bootstrap
// inline de index.html la lee para decidir el default de Consent Mode v2.
// Sin país (p. ej. `vercel dev` local) no escribe cookie: el bootstrap
// asume 'granted' (default MX/LATAM de la guía, caveat C-25).
import { next, geolocation } from '@vercel/functions';

export default function middleware(request) {
  const { country } = geolocation(request);
  if (!country) return next();
  return next({
    headers: {
      'Set-Cookie': 'rl_geo=' + country + '; Path=/; SameSite=Lax; Secure'
    }
  });
}

export const config = {
  // Solo documentos: excluye /api, assets y cualquier ruta con extensión de archivo.
  matcher: ['/((?!api/|Assets/|js/|.*\\.[a-zA-Z0-9]+$).*)']
};
