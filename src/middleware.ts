import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "./lib/constants";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/api/db-check", "/api/ping", "/api/turso-test"];
const PROTECTED_PATHS = ["/dashboard", "/reserve", "/account", "/api/reservations", "/api/negotiations"];

function getSecretKey() {
  const secret = process.env.SESSION_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // LOG : Afficher toutes les requêtes
  console.log(`📡 ${req.method} ${pathname}`);

  // Ignorer les routes publiques
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    console.log(`✅ Route publique: ${pathname}`);
    return NextResponse.next();
  }

  // Ignorer les assets statiques
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // Vérifier si la route est protégée
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  console.log(`🔒 Route protégée: ${pathname}`);

  // Vérifier le token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    console.log(`❌ Pas de token pour: ${pathname}`);
    return redirectToLogin(req);
  }

  try {
    await jwtVerify(token, getSecretKey());
    console.log(`✅ Token valide pour: ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    console.error(`❌ Token invalide pour ${pathname}:`, error);
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  
  const loginUrl = new URL("/login", req.url);
  if (!req.nextUrl.pathname.startsWith("/login")) {
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
  }
  console.log(`↩️ Redirection vers login: ${loginUrl.toString()}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reserve/:path*",
    "/account/:path*",
    "/api/reservations/:path*",
    "/api/negotiations/:path*",
  ],
};