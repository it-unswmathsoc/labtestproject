/**
 * Bootstraps an admin. The service role is required, not incidental: public.admins
 * has no INSERT policy, which is what stops a signed-in user promoting themselves.
 *
 *   node scripts/create-admin.ts <email> <password>
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2];
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: node scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function findUserByEmail(target: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((u) => u.email === target);
}

const created = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

let userId = created.data.user?.id;

if (created.error) {
  const existing = await findUserByEmail(email);
  if (!existing) {
    console.error(`Could not create or find ${email}: ${created.error.message}`);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`User ${email} already exists; granting admin.`);
}

const { error } = await supabase
  .from("admins")
  .upsert({ user_id: userId!, email }, { onConflict: "user_id" });

if (error) {
  console.error(`Failed to grant admin: ${error.message}`);
  process.exit(1);
}

console.log(`${email} is an admin (${userId}).`);
