import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const [, , csvPath] = process.argv;
if (!csvPath) {
  console.error("Usage: node supabase/scripts/import-auth-users-from-csv.mjs <file.csv>");
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, "utf8");
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const errors = [];

for (const [index, record] of records.entries()) {
  const { email, password, phone } = record;
  if (!email) {
    errors.push(`Row ${index + 2}: missing email.`);
    continue;
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
  });

  if (error) {
    errors.push(`Row ${index + 2}: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error("Finished with errors:\n" + errors.join("\n"));
  process.exit(1);
}

console.log(`Successfully provisioned ${records.length} users.`);
