import { createHash } from "crypto";

export * from "./session";

const PIN_SALT = process.env.PIN_SALT || "stock_checker_salt_2026";

/**
 * Hash numeric PIN with salt using SHA-256
 */
export function hashPin(pin: string): string {
  return createHash("sha256").update(`${pin}:${PIN_SALT}`).digest("hex");
}

/**
 * Verify if raw PIN matches stored SHA-256 hash
 */
export function verifyPin(pin: string, expectedHash: string): boolean {
  if (!pin || !expectedHash) return false;
  const incomingHash = hashPin(pin);
  return incomingHash === expectedHash;
}
