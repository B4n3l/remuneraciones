import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isDashboard = pathname.startsWith("/dashboard");
    const isAdminRoute = pathname.startsWith("/dashboard/admin");
    const isRoot = pathname === "/";

    if (isRoot) {
        return NextResponse.redirect(new URL(session ? "/dashboard" : "/login", request.url));
    }

    if (isAuthPage) {
        if (session) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    if (isDashboard) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        if (isAdminRoute && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*", "/login", "/register"],
};
