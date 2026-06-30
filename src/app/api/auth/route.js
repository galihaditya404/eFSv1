import { NextResponse } from 'next/server';

const PASSWORD_RAHASIA = "indo2026#tax";

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password === PASSWORD_RAHASIA) {
      // Buat response sukses
      const response = NextResponse.json({ success: true }, { status: 200 });

      // Tanamkan cookie 'auth' yang berlaku selama 30 hari
      // Cookie ini diset HttpOnly dan SameSite Strict agar sangat aman dari pencurian (XSS)
      response.cookies.set({
        name: 'auth',
        value: 'true',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 hari
        sameSite: 'strict'
      });

      return response;
    }

    return NextResponse.json({ error: "Password salah!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE() {
  // Proses Logout (Hapus cookie)
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.delete('auth');

  return response;
}
