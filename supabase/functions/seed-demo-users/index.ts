// Seed demo users (one-shot). Uses service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    { email: "dueno@tauro.co", password: "demos.123", name: "Dueño Tauro", role: "owner" },
    { email: "cliente@demo.com", password: "demos.123", name: "Cliente Demo", role: "advertiser" },
  ];

  const results: any[] = [];

  for (const u of users) {
    // Try create; if exists, look it up and update password.
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (createErr) {
      // find existing
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find((x) => x.email === u.email);
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role },
        });
      } else {
        results.push({ email: u.email, error: createErr.message });
        continue;
      }
    } else {
      userId = created.user?.id ?? null;
    }

    if (userId) {
      // Upsert profile role
      await admin.from("profiles").upsert(
        { user_id: userId, email: u.email, name: u.name, role: u.role },
        { onConflict: "user_id" }
      );
      results.push({ email: u.email, password: u.password, role: u.role, user_id: userId, ok: true });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
