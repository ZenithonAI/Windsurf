import { createServerClient } from "@/lib/supabase/server"; // Updated import path
import { NextResponse } from "next/server";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/dashboard'; // Optional: get next path from query param

  if (code) {
    const supabase = createServerClient(); // Updated usage
    try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Auth Callback Error:', error.message);
            // Redirect back to login page with error message
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('error', 'Could not verify email. Please try logging in again.');
            return NextResponse.redirect(loginUrl);
        }
    } catch (e: any) {
        console.error('Auth Callback Exception:', e.message);
        // Redirect back to login page on unexpected errors
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'An unexpected error occurred during verification.');
        return NextResponse.redirect(loginUrl);
    }
  }

  // URL to redirect to after sign in process completes
  // Use 'next' parameter if provided, otherwise default to /dashboard
  const redirectUrl = new URL(next, request.url);
  return NextResponse.redirect(redirectUrl);
}