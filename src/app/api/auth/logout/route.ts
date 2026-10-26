import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("propstackly_session")?.value ||
      req.cookies.get("veltrivo_session")?.value;
    if (token) {
      await fetch(`${FASTAPI_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    const res = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    res.cookies.set({
      name: "propstackly_session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    res.cookies.set({
      name: "veltrivo_session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (err: any) {
    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: "propstackly_session",
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    res.cookies.set({
      name: "veltrivo_session",
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return res;
  }
}
