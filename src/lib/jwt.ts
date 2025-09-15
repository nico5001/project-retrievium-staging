import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE = 'retrievium_auth';

export async function makeJWT(sub: string) {
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(secret);
}
export async function readJWT(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub as string;
  } catch { return null; }
}
export const cookieName = COOKIE;
