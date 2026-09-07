import { NextRequest, NextResponse } from "next/server";

// Middleware leve: redireciona /app/* para /login se não houver cookie de sessão.
// A validação REAL (assinatura HMAC) é feita no layout server + em cada route.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/app")) {
    const hasCookie = req.cookies.get("cv_session")?.value;
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
