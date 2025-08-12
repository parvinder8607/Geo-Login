import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/userDB';

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ message: 'Missing username' }, { status: 400 });
    }

    // Get user from Supabase
    let user = await getUser(username);

    if (!user) {
      // New user, assign binary ID
      user = {
        id: Buffer.from(username, 'utf8'), // Store binary
        username,
        credentials: [],
      };
      await saveUser(user);
    } else {
      // Supabase returns bytea as base64 (or array depending on config)
      if (!(user.id instanceof Uint8Array)) {
        user.id = Buffer.from(user.id); // Ensure it's Buffer
      }
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'My Next.js App';

    const userPasskeys = user.credentials || [];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      userID: user.id, // Must be Buffer/Uint8Array
      attestationType: 'none',
      excludeCredentials: userPasskeys.map(passkey => ({
        id: Buffer.from(passkey.credentialID), // Ensure binary
        transports: passkey.transports || ['internal'],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Save challenge for verification later
    user.current_challenge = options.challenge;
    await saveUser(user);

    return NextResponse.json(options);
  } catch (err) {
    console.error('Error generating registration options:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
