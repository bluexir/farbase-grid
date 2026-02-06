import { Errors, createClient } from "@farcaster/quick-auth";

type VerifiedUser = {
  fid: number;
};

const client = createClient();

/**
 * Next.js Route Handler içinde:
 * - Authorization: Bearer <token> header'ını alır
 * - verifyJwt ile doğrular
 * - Token'dan fid (sub) döndürür
 */
export async function requireQuickAuthUser(request: Request): Promise<VerifiedUser> {
  const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Errors.InvalidTokenError("Missing token");
  }

  const token = authorization.slice("Bearer ".length).trim();

  // Domain = bu isteğin geldiği host (aud kontrolü için)
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;

  const payload = await client.verifyJwt({
    token,
    domain: host,
  });

  return { fid: payload.sub };
}

/**
 * Eğer route içinde "try/catch" ile özel hata mesajı vermek istersen:
 */
export function isInvalidTokenError(e: unknown): boolean {
  return e instanceof Errors.InvalidTokenError;
}
