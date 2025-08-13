// app/api/verify-login/route.js
import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/userDB';

export async function POST(req) {
  try {
    const { username, assertionResponse } = await req.json();

    if (!username || !assertionResponse) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const user = await getUser(username);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || `https://${rpID}`;

    const dbCredentials = user.credentials.map(cred => ({
      credentialID: Buffer.from(cred.credentialID, 'base64'),
      credentialPublicKey: Buffer.from(cred.credentialPublicKey, 'base64'),
      counter: cred.counter,
      transports: cred.transports || ['internal'],
    }));

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.current_challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: dbCredentials.find(
        c => c.credentialID.equals(Buffer.from(assertionResponse.id, 'base64url') || Buffer.from(assertionResponse.id, 'base64'))
      ),
    });

    if (verification.verified) {
      // Update counter
      const { newCounter } = verification.authenticationInfo;
      const authr = dbCredentials.find(c => c.credentialID.equals(
        Buffer.from(assertionResponse.id, 'base64url') || Buffer.from(assertionResponse.id, 'base64')
      ));
      if (authr) authr.counter = newCounter;

      user.credentials = dbCredentials.map(c => ({
        credentialID: c.credentialID.toString('base64'),
        credentialPublicKey: c.credentialPublicKey.toString('base64'),
        counter: c.counter,
        transports: c.transports,
      }));

      user.current_challenge = null;
      await saveUser(user);
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    console.error('Error verifying login:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
