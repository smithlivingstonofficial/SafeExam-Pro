import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { Json } from "@/types/database";

interface AuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  details = {},
}: AuditLogParams): Promise<void> {
  try {
    const headerList = await headers();
    const ipAddress =
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = headerList.get("user-agent") || "unknown";

    // Use admin client to reliably write to audit_logs without RLS barriers
    const supabase = createAdminClient();

    // Sanitize any undefined fields to valid JSON
    const sanitizedDetails = JSON.parse(JSON.stringify(details)) as Json;

    await supabase.from("audit_logs").insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: sanitizedDetails,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    // Audit logging should never bring down the primary user flow, but should be logged to stderr
    console.error("[SafeExam Audit Error]: Failed to write audit entry:", error);
  }
}
