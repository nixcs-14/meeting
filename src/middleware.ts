import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "./lib/constants";

// Routes publiques (pas besoin d'authentification)
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/api/db-check"];

// Routes protégées
const PROTECTED_PATHS = ["/dashboard", "/reserve", "/account", "/api/reservations", "/api/negotiations"];

function getSecretKey() {
  const secret = process.env.SESSION_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignorer les routes publiques
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
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

  // Vérifier le token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  try {
    await jwtVerify(token, getSecretKey());
    return NextResponse.next();
  } catch (error) {
    console.error("❌ Erreur JWT:", error);
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  
  const loginUrl = new URL("/login", req.url);
  // Ne pas ajouter next si on est déjà sur login
  if (!req.nextUrl.pathname.startsWith("/login")) {
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
  }
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