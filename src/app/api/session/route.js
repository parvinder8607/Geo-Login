// app/api/session/route.js

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(session.value);

    if (sessionData.loggedIn) {
      return NextResponse.json({ user: sessionData.username });
    }

    return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad session data' }, { status: 400 });
  }
}
