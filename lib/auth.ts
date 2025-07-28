import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const TOKEN_SECRET = process.env.TOKEN_SECRET || "your-token-secret"

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function generateJWT(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function generateAccessToken(managerId: string): {
  manager_id: string
  timestamp: number
  nonce: string
  signature: string
} {
  const timestamp = Date.now()
  const nonce = crypto.randomBytes(16).toString("hex")
  const signature = crypto
    .createHash("sha256")
    .update(managerId + timestamp + nonce + TOKEN_SECRET)
    .digest("hex")

  return {
    manager_id: managerId,
    timestamp,
    nonce,
    signature,
  }
}

export function verifyAccessToken(token: {
  manager_id: string
  timestamp: number
  nonce: string
  signature: string
}): { success: boolean; reason?: string } {
  const { manager_id, timestamp, nonce, signature } = token
  const now = Date.now()

  // Check if token is expired (30 seconds)
  if (now - timestamp > 30000) {
    return { success: false, reason: "Token expired" }
  }

  // Verify signature
  const expectedSignature = crypto
    .createHash("sha256")
    .update(manager_id + timestamp + nonce + TOKEN_SECRET)
    .digest("hex")

  if (expectedSignature !== signature) {
    return { success: false, reason: "Invalid signature" }
  }

  return { success: true }
}
