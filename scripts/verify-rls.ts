/**
 * Asserts the RLS contract from the outside, through PostgREST, the way the app
 * hits it. Run against a seeded database:
 *   node scripts/verify-rls.ts
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PUBLISHED_TEST = "7e570000-0000-4000-8000-000000000001";
const DRAFT_TEST = "7e570000-0000-4000-8000-000000000002";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let failures = 0;

function check(name: string, passed: boolean, detail = "") {
  console.log(`${passed ? "  ok  " : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures++;
}

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url, publishableKey);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

async function checkAnonReads(anon: SupabaseClient) {
  console.log("\nanon reads");

  const published = await anon.from("lab_tests").select("*").eq("id", PUBLISHED_TEST);
  check("published test is visible", published.data?.length === 1);

  const draft = await anon.from("lab_tests").select("*").eq("id", DRAFT_TEST);
  check("draft test is invisible", draft.data?.length === 0, `error=${draft.error?.message ?? "none"}`);

  // A missing EXECUTE grant on is_admin() would surface here, not as a policy failure.
  check("select does not error", published.error === null, published.error?.message ?? "");

  const tree = await anon
    .from("questions")
    .select("*, question_parts(*, steps(*, hints(*)))")
    .eq("lab_test_id", PUBLISHED_TEST);
  const parts = tree.data?.flatMap((q) => q.question_parts) ?? [];
  const steps = parts.flatMap((p) => p.steps);
  check("full question tree is readable", tree.data?.length === 5, `questions=${tree.data?.length}`);
  check("parts are readable", parts.length === 7, `parts=${parts.length}`);
  check("steps are readable", steps.length === 2, `steps=${steps.length}`);
  check("hints are readable", steps.flatMap((s) => s.hints).length === 1);

  const draftQuestions = await anon.from("questions").select("*").eq("lab_test_id", DRAFT_TEST);
  check("draft descendants are invisible", draftQuestions.data?.length === 0);
}

async function checkAnonWrites(anon: SupabaseClient) {
  console.log("\nanon writes");

  const insert = await anon.from("courses").insert({ code: "HACK", name: "nope" });
  check("insert is rejected", insert.error !== null, insert.error?.code ?? "no error");

  const update = await anon.from("lab_tests").update({ is_published: true }).eq("id", DRAFT_TEST);
  check("update is rejected", update.error !== null || update.count === 0);

  const rpc = await anon.rpc("reorder_questions", {
    p_lab_test_id: PUBLISHED_TEST,
    p_ids: [],
  });
  check("reorder RPC is rejected", rpc.error !== null, rpc.error?.code ?? "no error");
}

async function checkAdminCrud(admin: SupabaseClient) {
  console.log("\nadmin CRUD");

  const draft = await admin.from("lab_tests").select("*").eq("id", DRAFT_TEST);
  check("admin sees drafts", draft.data?.length === 1);

  const questionId = crypto.randomUUID();
  const created = await admin.from("questions").insert({
    id: questionId,
    lab_test_id: DRAFT_TEST,
    number: 1,
    prompt_latex: "verify-rls temporary question",
    sort_order: 1,
  });
  check("admin can insert", created.error === null, created.error?.message ?? "");

  const updated = await admin
    .from("questions")
    .update({ prompt_latex: "edited" })
    .eq("id", questionId)
    .select();
  check("admin can update", updated.data?.length === 1, updated.error?.message ?? "");

  const second = crypto.randomUUID();
  await admin.from("questions").insert({
    id: second,
    lab_test_id: DRAFT_TEST,
    number: 2,
    prompt_latex: "second",
    sort_order: 2,
  });

  const reorder = await admin.rpc("reorder_questions", {
    p_lab_test_id: DRAFT_TEST,
    p_ids: [second, questionId],
  });
  check("admin can reorder", reorder.error === null, reorder.error?.message ?? "");

  // Scoped to the two rows this script created: the draft test may hold authored
  // content, and asserting on the whole test would fail against a used database.
  const reordered = await admin
    .from("questions")
    .select("id, sort_order, number")
    .in("id", [questionId, second])
    .order("sort_order");
  const first = reordered.data?.[0];
  check(
    "reorder is 1-indexed and applied",
    first?.id === second && first?.sort_order === 1 && first?.number === 1,
    `first=${JSON.stringify(first)}`
  );

  const deleted = await admin.from("questions").delete().in("id", [questionId, second]);
  check("admin can delete", deleted.error === null, deleted.error?.message ?? "");
}

async function checkNonAdmin() {
  console.log("\nsigned-in non-admin");

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const email = `not-an-admin-${Date.now()}@mathsoc.test`;
  const password = "labtest123";
  const { data: created, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`could not create test user: ${error.message}`);

  try {
    const user = await signIn(email, password);
    const insert = await user.from("courses").insert({ code: "NOPE", name: "nope" });
    check("write is rejected", insert.error !== null, insert.error?.code ?? "no error");

    const draft = await user.from("lab_tests").select("*").eq("id", DRAFT_TEST);
    check("draft stays invisible", draft.data?.length === 0);
  } finally {
    if (created.user) await service.auth.admin.deleteUser(created.user.id);
  }
}

async function checkStorage(anon: SupabaseClient, admin: SupabaseClient) {
  console.log("\nstorage (question-images)");

  const bytes = readFileSync("public/questions/math1081-lt1-q8a.png");
  const path = `verify-rls/${crypto.randomUUID()}.png`;

  const anonUpload = await anon.storage
    .from("question-images")
    .upload(path, bytes, { contentType: "image/png" });
  check("anon upload is rejected", anonUpload.error !== null, anonUpload.error?.message ?? "no error");

  const upload = await admin.storage
    .from("question-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  check("admin can upload", upload.error === null, upload.error?.message ?? "");

  // Upsert needs insert + select + update; a missing grant fails silently here.
  const reupload = await admin.storage
    .from("question-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  check("admin can replace (upsert)", reupload.error === null, reupload.error?.message ?? "");

  const { data: publicUrl } = admin.storage.from("question-images").getPublicUrl(path);
  const fetched = await fetch(publicUrl.publicUrl);
  check("public read works", fetched.ok, `status=${fetched.status}`);

  const anonDelete = await anon.storage.from("question-images").remove([path]);
  const stillThere = await fetch(publicUrl.publicUrl);
  check("anon delete is rejected", stillThere.ok, anonDelete.error?.message ?? "object was removed");

  const removed = await admin.storage.from("question-images").remove([path]);
  check("admin can delete", removed.error === null, removed.error?.message ?? "");

  // Prove the bucket's own config took effect, not just its policies.
  const wrongType = await admin.storage
    .from("question-images")
    .upload(`verify-rls/${crypto.randomUUID()}.txt`, new Blob(["not an image"]), {
      contentType: "text/plain",
    });
  check(
    "disallowed mime type is rejected",
    wrongType.error !== null,
    wrongType.error?.message ?? "upload succeeded"
  );

  const oversized = await admin.storage
    .from("question-images")
    .upload(`verify-rls/${crypto.randomUUID()}.png`, new Uint8Array(6 * 1024 * 1024), {
      contentType: "image/png",
    });
  check(
    "oversized upload is rejected",
    oversized.error !== null,
    oversized.error?.message ?? "upload succeeded"
  );
}

const [adminEmail = "admin@mathsoc.test", adminPassword = "labtest123"] =
  process.argv.slice(2);

const anon = createClient(url, publishableKey, { auth: { persistSession: false } });
const admin = await signIn(adminEmail, adminPassword);

await checkAnonReads(anon);
await checkAnonWrites(anon);
await checkAdminCrud(admin);
await checkNonAdmin();
await checkStorage(anon, admin);

console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
