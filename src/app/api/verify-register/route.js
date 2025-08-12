import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getUser, saveUser } from '@/lib/userDB';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, attestationResponse } = body;

    if (!username || !attestationResponse) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Get the user and stored challenge
    const user = await getUser(username);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.current_challenge,
      expectedOrigin: process.env.NEXT_PUBLIC_EXPECTED_ORIGIN || `https://${rpID}`,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Save the credential in Supabase
      const newCredential = {
        credentialID: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        transports: attestationResponse.response.transports || ['internal'],
      };

      const updatedCreds = [...(user.credentials || []), newCredential];
      user.credentials = updatedCreds;
      user.current_challenge = null; // Clear challenge

      await saveUser(user);
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    console.error('Error verifying registration:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
