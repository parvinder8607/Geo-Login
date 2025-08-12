import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/userDB';

export async function POST(req) {
  try {
    const { username, attestationResponse } = await req.json();

    if (!username || !attestationResponse) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const user = await getUser(username);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || `https://${rpID}`;

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.current_challenge, // must match exactly what was generated
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      const newCredential = {
        credentialID: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        transports: attestationResponse.response.transports || ['internal'],
      };

      user.credentials = [...(user.credentials || []), newCredential];
      user.current_challenge = null;

      await saveUser(user);
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    console.error('Error verifying registration:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
