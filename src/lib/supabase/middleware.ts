import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/examiner") ||
    pathname.startsWith("/proctor") ||
    pathname.startsWith("/candidate");

  const isAuthPath =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  // Unauthenticated user trying to access protected route -> redirect to /login
  if (isProtectedPath && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register -> redirect to assigned portal
  if (isAuthPath && user) {
    const isMasterAdmin =
      user.email?.toLowerCase() === "smithlivingston2005@gmail.com";
    const userRole = isMasterAdmin
      ? "admin"
      : (user.user_metadata?.role as string) || "candidate";

    const targetUrl = new URL(
      `/${userRole === "admin" || userRole === "examiner" || userRole === "proctor" ? userRole : "candidate"}`,
      request.url
    );
    return NextResponse.redirect(targetUrl);
  }

  return supabaseResponse;
}
