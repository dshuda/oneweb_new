/**
 * Uploads every file under website/public to DigitalOcean Spaces, preserving
 * the directory layout, and writes website/app/lib/asset-manifest.json.
 *
 *   node scripts/upload-assets.mjs
 *
 * Credentials come from .env.prod (SPACES_*). Keys are deterministic — the same
 * local path always maps to the same CDN object — so re-running is idempotent
 * and existing URLs keep working.
 */
import { createHash, createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
// Both apps ship their own /public tree; each gets its own CDN prefix and
// manifest so a name collision between them is impossible.
const APPS = [
  { name: 'website', publicDir: resolve(root, 'website/public'), prefixSuffix: 'web',
    manifest: resolve(root, 'website/app/lib/asset-manifest.json') },
  { name: 'portal',  publicDir: resolve(root, 'portal/public'),  prefixSuffix: 'portal',
    manifest: resolve(root, 'portal/lib/asset-manifest.json') },
];

// ---- config -----------------------------------------------------------------
const env = {};
for (const line of readFileSync(resolve(root, '.env.prod'), 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const ACCESS = env.SPACES_ACCESS_KEY_ID;
const SECRET = env.SPACES_SECRET_ACCESS_KEY;
const BUCKET = env.SPACES_BUCKET_NAME;
const REGION = env.SPACES_REGION || 'sgp1';
const HOST = `${REGION}.digitaloceanspaces.com`;
const CDN = (env.SPACES_CDN_ENDPOINT || '').replace(/\/+$/, '');
const ROOT = (env.SPACES_ROOT_FOLDER || 'Onetap').replace(/^\/+|\/+$/g, '');

if (!ACCESS || !SECRET || !BUCKET) {
  console.error('SPACES_ACCESS_KEY_ID / SPACES_SECRET_ACCESS_KEY / SPACES_BUCKET_NAME must be set in .env.prod');
  process.exit(1);
}

const CONTENT_TYPES = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// ---- SigV4 ------------------------------------------------------------------
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const hmac = (k, d) => createHmac('sha256', k).update(d).digest();

function sign(method, key, body, contentType) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);

  // Keys may contain characters that must be percent-encoded in the URI.
  const canonicalUri = '/' + key.split('/').map(encodeURIComponent).join('/');
  const canonicalHeaders =
    `host:${BUCKET}.${HOST}\n` +
    `x-amz-acl:public-read\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-acl;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const scope = `${dateStamp}/${REGION}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');

  let k = hmac(`AWS4${SECRET}`, dateStamp);
  k = hmac(k, REGION); k = hmac(k, 's3'); k = hmac(k, 'aws4_request');
  const signature = createHmac('sha256', k).update(stringToSign).digest('hex');

  return {
    url: `https://${BUCKET}.${HOST}${canonicalUri}`,
    headers: {
      'x-amz-date': amzDate,
      'x-amz-acl': 'public-read',
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${ACCESS}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

// ---- walk + upload ----------------------------------------------------------
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let totalDone = 0, totalFailed = 0;

for (const app of APPS) {
  let files;
  try {
    files = walk(app.publicDir);
  } catch {
    console.log(`skipping ${app.name}: no public directory`);
    continue;
  }

  const PREFIX = `${ROOT}/${app.prefixSuffix}`;
  console.log(`${app.name}: uploading ${files.length} assets -> ${CDN}/${PREFIX}`);

  const manifest = {};
  let done = 0, failed = 0;

  for (const file of files) {
    // "/service-icons/icon_cleaning.svg" — the path the app already references.
    const rel = '/' + relative(app.publicDir, file).split(sep).join('/');
    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
    const body = readFileSync(file);
    // Characters like apostrophes break SigV4 canonical-URI encoding (fetch
    // normalises %27 back to '), so object keys are restricted to a safe set.
    const safeRel = rel.replace(/[^A-Za-z0-9._/-]/g, '-');
    const key = `${PREFIX}${safeRel}`;
    const { url, headers } = sign('PUT', key, body, CONTENT_TYPES[ext] || 'application/octet-stream');

    try {
      const res = await fetch(url, { method: 'PUT', headers, body });
      if (!res.ok) {
        console.error(`  FAIL ${rel} -> ${res.status} ${(await res.text()).slice(0, 120)}`);
        failed++;
        continue;
      }
      manifest[rel] = `${CDN}/${key}`;
      done++;
    } catch (err) {
      console.error(`  FAIL ${rel} -> ${err.message}`);
      failed++;
    }
  }

  mkdirSync(dirname(app.manifest), { recursive: true });
  writeFileSync(app.manifest, JSON.stringify(manifest, null, 2) + String.fromCharCode(10), 'utf8');
  console.log(`  uploaded ${done}, failed ${failed} -> ${app.manifest}`);
  totalDone += done; totalFailed += failed;
}

console.log(`total uploaded ${totalDone}, failed ${totalFailed}`);
if (totalFailed) process.exit(1);
