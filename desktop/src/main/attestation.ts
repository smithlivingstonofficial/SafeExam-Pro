import * as crypto from "crypto";
import * as os from "os";

// Shared secret key for HMAC client attestation (matches Next.js server verification)
export const ATTESTATION_SECRET = "SAFEEXAM_PRO_SECURE_CLIENT_ATTESTATION_2026_SECRET";

export interface ClientAttestation {
  token: string;
  hardwareId: string;
  timestamp: number;
  platform: string;
}

/**
 * Derives a deterministic machine hardware fingerprint based on OS hostname, CPU model, and network interfaces.
 */
export function getMachineHardwareFingerprint(): string {
  try {
    const networkInterfaces = os.networkInterfaces();
    let mac = "";

    for (const ifaceName of Object.keys(networkInterfaces)) {
      const ifaceList = networkInterfaces[ifaceName];
      if (ifaceList) {
        for (const net of ifaceList) {
          if (!net.internal && net.mac && net.mac !== "00:00:00:00:00:00") {
            mac = net.mac;
            break;
          }
        }
      }
      if (mac) break;
    }

    const rawId = `${os.hostname()}:${os.platform()}:${os.arch()}:${mac || "default-mac"}`;
    return crypto.createHash("sha256").update(rawId).digest("hex").substring(0, 32);
  } catch {
    return "fallback-machine-id";
  }
}

/**
 * Generates an HMAC-SHA256 attestation payload proving this request originates from the compiled native client.
 */
export function generateAttestationToken(): ClientAttestation {
  const hardwareId = getMachineHardwareFingerprint();
  const timestamp = Date.now();
  const platform = os.platform();

  const dataToSign = `${hardwareId}:${timestamp}:${platform}`;
  const hmac = crypto.createHmac("sha256", ATTESTATION_SECRET);
  hmac.update(dataToSign);
  const signature = hmac.digest("hex");

  const token = Buffer.from(
    JSON.stringify({
      hardwareId,
      timestamp,
      platform,
      signature,
    })
  ).toString("base64");

  return {
    token,
    hardwareId,
    timestamp,
    platform,
  };
}

/**
 * Verifies an attestation token (used on both client verification and server).
 */
export function verifyAttestationToken(tokenString: string, maxAgeMs: number = 300000): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(tokenString, "base64").toString("utf-8"));
    const { hardwareId, timestamp, platform, signature } = decoded;

    if (!hardwareId || !timestamp || !signature) return false;

    // Check expiration (default 5 minutes window)
    if (Math.abs(Date.now() - timestamp) > maxAgeMs) {
      return false;
    }

    const dataToSign = `${hardwareId}:${timestamp}:${platform}`;
    const hmac = crypto.createHmac("sha256", ATTESTATION_SECRET);
    hmac.update(dataToSign);
    const expectedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
