import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/leads",
  "/deals",
  "/properties",
  "/plot-maps",
  "/installment-plans",
  "/rentals",
  "/tax-calculator",
  "/commissions",
  "/speed-to-lead",
  "/follow-ups",
  "/site-visits",
  "/team",
  "/reports",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("propstackly_session")?.value ||
    request.cookies.get("veltrivo_session")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If unauthenticated user tries to access a protected route, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated user visits /login or /signup, redirect to dashboard
  if ((pathname === "/login" || pathname === "/signup") && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/deals/:path*",
    "/properties/:path*",
    "/plot-maps/:path*",
    "/installment-plans/:path*",
    "/rentals/:path*",
    "/tax-calculator/:path*",
    "/commissions/:path*",
    "/speed-to-lead/:path*",
    "/follow-ups/:path*",
    "/site-visits/:path*",
    "/team/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
  ],
};
