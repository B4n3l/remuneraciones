import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
    const session = await auth();

    const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");

    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
    const isAdminRoute = request.nextUrl.pathname.startsWith("/dashboard/admin");

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
    matcher: ["/dashboard/:path*", "/login", "/register"],
};
