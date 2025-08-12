import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/userDB';


function strToUint8Array(str) {
    return new TextEncoder().encode(str);
  }

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'My Next.js App';

    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: strToUint8Array(username),  // <--- this fixes the error
        userName: username,
        timeout: 60000,
        attestationType: 'none',
      });

    userDB.set(username, {
      challenge: options.challenge,
      credentials: userDB.get(username)?.credentials || [],
    });

    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
