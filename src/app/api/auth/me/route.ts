import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("propstackly_session")?.value ||
      req.cookies.get("veltrivo_session")?.value;
    if (!token) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: "Session expired or invalid" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { detail: "Failed to connect to authentication server" },
      { status: 503 }
    );
  }
}
