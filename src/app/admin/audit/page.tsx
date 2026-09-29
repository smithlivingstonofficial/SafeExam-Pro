import { createAdminClient } from "@/lib/supabase/server";
import { AuditLogsClient, AuditLogItem } from "@/components/admin/audit-logs-client";

export default async function AuditLogsPage() {
  const adminClient = createAdminClient();

  // Fetch real audit logs from Supabase
  const { data: dbLogs } = await adminClient
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      created_at,
      user_id
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch user profiles for user name lookup
  const typedLogs = (dbLogs || []) as Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: unknown;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user_id: string | null;
  }>;

  const userIds = typedLogs.map((l) => l.user_id).filter(Boolean) as string[];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const typedProfiles = (profiles || []) as Array<{
    id: string;
    full_name: string;
    role: string;
  }>;

  const profileMap = new Map(typedProfiles.map((p) => [p.id, p]));

  const initialLogs: AuditLogItem[] = typedLogs.map((l) => {
    const prof = l.user_id ? profileMap.get(l.user_id) : null;
    const userLabel = prof ? `${prof.full_name} (${prof.role})` : l.user_id ? `User ${l.user_id.slice(0, 8)}` : "System";

    return {
      id: l.id.slice(0, 8).toUpperCase(),
      action: l.action,
      user: userLabel,
      ip: l.ip_address || "127.0.0.1",
      userAgent: l.user_agent || "Direct Server Action",
      timestamp: l.created_at,
      entityType: l.entity_type || "general",
      entityId: l.entity_id || "—",
      details: (l.details as Record<string, unknown>) || {},
    };
  });

  return <AuditLogsClient initialLogs={initialLogs} />;
}
