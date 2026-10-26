import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agency_name, full_name, email, phone, city, password } = body;

    if (!agency_name || !email || !password || !full_name) {
      return NextResponse.json(
        { detail: "Agency name, full name, email, and password are required" },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const response = await fetch(`${FASTAPI_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify({
        agency_name,
        full_name,
        email,
        phone,
        city: city || "Islamabad",
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Registration failed" },
        { status: response.status }
      );
    }

    // Set secure HttpOnly session cookie
    const res = NextResponse.json({
      success: true,
      user: data.user,
    });

    const isHttps =
      req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

    res.cookies.set({
      name: "propstackly_session",
      value: data.access_token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error: any) {
    console.error("Next.js register route error:", error);
    return NextResponse.json(
      { detail: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
