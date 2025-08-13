import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/userDB';

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ message: 'Missing username' }, { status: 400 });
    }

    const user = await getUser(username);

    if (!user || !user.credentials || user.credentials.length === 0) {
      return NextResponse.json({ message: 'No credentials found for this user' }, { status: 404 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

    const allowCredentials = user.credentials.map(cred => ({
      id: cred.credentialID, // <== convert base64 string to Buffer here
      type: 'public-key',
      transports: cred.transports || ['internal'],
    }));

    const options = generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    user.current_challenge = options.challenge;
    await saveUser(user);

    return NextResponse.json(options);
  } catch (err) {
    console.error('Error generating login challenge:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
