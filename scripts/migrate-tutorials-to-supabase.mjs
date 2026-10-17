import env from '@next/env';
import { list } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

env.loadEnvConfig(process.cwd());

const TUTORIALS_PATH = 'data/tutorials.json';
const apply = process.argv.includes('--apply');

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const { blobs } = await list({ prefix: TUTORIALS_PATH, limit: 1 });
const blob = blobs.find((item) => item.pathname === TUTORIALS_PATH);

if (!blob) {
  console.log('No legacy tutorial file was found. Nothing to migrate.');
  process.exit(0);
}

const response = await fetch(
  `${blob.url}?version=${blob.uploadedAt.getTime()}`,
  { cache: 'no-store' },
);
if (!response.ok) throw new Error('Could not read the legacy tutorial file.');

const tutorials = await response.json();
if (!Array.isArray(tutorials)) {
  throw new Error('The legacy tutorial file is not a JSON array.');
}

console.log(`Validated ${tutorials.length} legacy tutorial record(s).`);
if (!apply) {
  console.log(
    'Dry run only. Re-run with --apply after reviewing the SQL migration.',
  );
  process.exit(0);
}

const serviceKey =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!serviceKey) {
  throw new Error(
    'Missing required environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(
  required('NEXT_PUBLIC_SUPABASE_URL'),
  serviceKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
const { error } = await supabase
  .from('tutorials')
  .upsert(tutorials, { onConflict: 'id' });
if (error) throw error;

console.log(`Migrated ${tutorials.length} tutorial record(s) to Supabase.`);
