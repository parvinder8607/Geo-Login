import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/userDB'; // must be a Map()

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ message: 'Missing username' }, { status: 400 });
    }

    // Retrieve user from DB (create if not exists)
    let user = userDB.get(username);
    if (!user) {
      user = {
        username,
        id: Buffer.from(username, 'utf8'), // required format now
        credentials: [],
      };
      userDB.set(username, user);
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'My Next.js App';

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      userID: user.id,
      attestationType: 'none',
      excludeCredentials: user.credentials.map(passkey => ({
        id: passkey.credentialID,
        transports: passkey.transports || ['internal'],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Save challenge
    user.currentChallenge = options.challenge;
    userDB.set(username, user);

    return NextResponse.json(options);
  } catch (err) {
    console.error('Error generating registration options:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
