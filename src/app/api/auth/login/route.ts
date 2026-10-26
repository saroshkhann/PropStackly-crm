import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const response = await fetch(`${FASTAPI_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Authentication failed" },
        { status: response.status }
      );
    }

    // Set secure HttpOnly session cookie
    const res = NextResponse.json({
      success: true,
      user: data.user,
    });

    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

    res.cookies.set({
      name: "propstackly_session",
      value: data.access_token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Clear legacy cookie if present
    res.cookies.set({
      name: "veltrivo_session",
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Login route error:", err.message);
    return NextResponse.json(
      { detail: "Unable to connect to authentication server. Please ensure the backend is running." },
      { status: 503 }
    );
  }
}
