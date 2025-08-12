import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { userDB } from '@/lib/userDB';

export async function POST(req) {
  try {
    const { username, attestationResponse } = await req.json();
    if (!username || !attestationResponse) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const user = userDB.get(username);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_ORIGIN || `https://${rpID}`;

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.challenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      user.credentials.push({
        credentialID,
        credentialPublicKey,
        counter,
      });

      userDB.set(username, user);

      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ verified: false }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
