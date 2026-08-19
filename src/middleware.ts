import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Libera arquivos estáticos, favicon, assets e rotas de API/Auth
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // O nome correto do cookie de sessão gerado em src/lib/auth.ts é 'jac_session'
  const token = request.cookies.get("jac_session")?.value;
  const isLoginPage = pathname === "/login";

  // Se for a página de login e já tiver sessão ativa, manda para o app
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Se tentar acessar o painel (/app) sem token, manda para o login
  if (!isLoginPage && !token && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
