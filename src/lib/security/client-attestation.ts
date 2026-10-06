import * as crypto from "crypto";

export const ATTESTATION_SECRET = "SAFEEXAM_PRO_SECURE_CLIENT_ATTESTATION_2026_SECRET";

export interface AttestationVerificationResult {
  isValid: boolean;
  hardwareId?: string;
  platform?: string;
  timestamp?: number;
  reason?: string;
}

/**
 * Validates a client attestation token sent by the SafeExam Pro Desktop Client.
 */
export function verifyClientAttestation(
  tokenString: string | null | undefined,
  maxAgeMs: number = 600000 // 10 minutes tolerance
): AttestationVerificationResult {
  if (!tokenString) {
    return { isValid: false, reason: "MISSING_TOKEN" };
  }

  try {
    const decoded = JSON.parse(Buffer.from(tokenString, "base64").toString("utf-8"));
    const { hardwareId, timestamp, platform, signature } = decoded;

    if (!hardwareId || !timestamp || !signature) {
      return { isValid: false, reason: "MALFORMED_TOKEN" };
    }

    // Verify timestamp freshness
    if (Math.abs(Date.now() - Number(timestamp)) > maxAgeMs) {
      return { isValid: false, reason: "EXPIRED_TOKEN" };
    }

    const dataToSign = `${hardwareId}:${timestamp}:${platform}`;
    const hmac = crypto.createHmac("sha256", ATTESTATION_SECRET);
    hmac.update(dataToSign);
    const expectedSignature = hmac.digest("hex");

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );

    if (!isMatch) {
      return { isValid: false, reason: "INVALID_SIGNATURE" };
    }

    return {
      isValid: true,
      hardwareId,
      platform,
      timestamp,
    };
  } catch {
    return { isValid: false, reason: "DECODE_ERROR" };
  }
}
