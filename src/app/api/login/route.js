import { NextResponse } from 'next/server'
import { cookies } from 'next/headers';


// Haversine formula to calculate distance in meters
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;

  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Handle POST login
export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, location } = body;

    const allowedLocation = {
      latitude: parseFloat(process.env.NEXT_PUBLIC_ALLOWED_LAT),
      longitude: parseFloat(process.env.NEXT_PUBLIC_ALLOWED_LON),
      radius: parseFloat(process.env.NEXT_PUBLIC_ALLOWED_RADIUS),
    };

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json(
        { message: "Location is required." },
        { status: 400 }
      );
    }

    const distance = haversineDistance(location, allowedLocation);

    console.log(distance);
    if (distance > allowedLocation.radius) {
      return NextResponse.json(
        { message: "Access denied: outside allowed area." },
        { status: 403 }
      );
    }

    // Simple auth logic (you can replace this)
    if (username === "demo" && password === "1234") {

        const cookieStore = await cookies();

        // ✅ Create a session object
        const sessionData = {
          username: 'demo',
          loggedIn: true,
        };
    
        // ✅ Set cookie (HTTP-only, secure)
        cookieStore.set('session', JSON.stringify(sessionData), {
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

      return NextResponse.json({ message: "Login successful" });
    }

    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// Optional GET (for test)
export async function GET() {
  return NextResponse.json({ message: "Login API is working" });
}
