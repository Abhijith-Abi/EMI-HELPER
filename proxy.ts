import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const userId = request.cookies.get("user-id")?.value;
    const { pathname } = request.nextUrl;

    // Protected dashboard routes
    if (pathname.startsWith("/dashboard")) {
        if (!userId || userId === "1") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Auth pages and root route
    if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
        if (userId && userId !== "1") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        // Redirect signup and root to login
        if (pathname === "/" || pathname === "/signup") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup", "/"],
};
