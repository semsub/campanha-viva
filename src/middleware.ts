import { NextRequest, NextResponse } from "next/server";

// Middleware leve: apenas redireciona /app/* para /login se não houver cookie de sessão.
// A validação real é feita no layout server (que checa assinatura do cookie).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/app")) {
    const hasCookie = req.cookies.get("jac_session")?.value;
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
