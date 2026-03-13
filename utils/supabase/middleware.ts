import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/unauthorized";

  if (!user && !isPublicRoute) {
    // no user trying to access a protected route, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // --- ROLE BASED ACCESS CONTROL LOGIC ---
  if (user && !isPublicRoute) {
    // fetch user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_role")
      .eq("user_email", user.email)
      .single();

    const role = roleData?.user_role;

    const path = request.nextUrl.pathname;

    // Restrict access
    if (path.startsWith("/project-manager") && role !== "project") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (path.startsWith("/inventory-manager") && role !== "inventory") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (path.startsWith("/tech") && role !== "tech") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Redirect authenticated users trying to access the login page
  if (user && request.nextUrl.pathname === "/") {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_role")
      .eq("user_email", user.email)
      .single();

    const role = roleData?.user_role;

    if (role === "project") {
      return NextResponse.redirect(new URL("/project-manager", request.url));
    } else if (role === "inventory") {
      return NextResponse.redirect(new URL("/inventory-manager", request.url));
    } else if (role === "tech") {
      return NextResponse.redirect(new URL("/tech", request.url));
    } else {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}
