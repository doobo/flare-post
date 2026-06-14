import { sign, verify } from "hono/jwt";

async function test() {
  try {
    const payload = {
      id: 1,
      username: 'admin',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    };
    const secret = "default_jwt_secret_key";
    
    console.log("Signing...");
    const token = await sign(payload, secret);
    console.log("Token:", token);
    
    console.log("Verifying...");
    const decoded = await verify(token, secret, "HS256");
    console.log("Decoded:", decoded);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
