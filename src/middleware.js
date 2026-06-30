import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Izinkan akses ke halaman login, API (kecuali jika mau diproteksi juga), dan file statis
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Cek keberadaan cookie 'auth'
  const isAuthenticated = request.cookies.get('auth');

  // Jika tidak punya tiket login, tendang ke /login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login, silakan lewat
  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware ini pada path tertentu (hindari eksekusi berlebih)
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
