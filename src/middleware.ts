import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("jac_session")?.value;
  const { pathname } = req.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Basic token validation (check structure only, full validation in API)
    const parts = token.split(".");
    if (parts.length !== 2) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.set("jac_session", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  // Redirect / to dashboard or login
  if (pathname === "/") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in, redirect /login to /dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
