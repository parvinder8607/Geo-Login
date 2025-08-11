// app/api/logout/route.js

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // Delete the cookie
  });

  return NextResponse.json({ message: 'Logged out' });
}
