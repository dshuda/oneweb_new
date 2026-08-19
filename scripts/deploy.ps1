<#
.SYNOPSIS
    Builds and deploys the OneTap API and storefront to the droplet.

.DESCRIPTION
    Reads every setting from .env.prod (git-ignored) — nothing is hardcoded here.
    Publishes the .NET API and the Next.js site, ships both over SSH, writes a
    PM2 ecosystem file whose env comes from .env.prod, patches nginx so the site
    is served at /web and the API at /api/v1, then verifies the result.

    Layout on the server:
      /home/onetap/oneweb/publish   API        (PM2: oneweb-backend,  :5102)
      /home/onetap/oneweb/web       storefront (PM2: oneweb-web,      :3001)

.EXAMPLE
    ./scripts/deploy.ps1                 # build + deploy everything
    ./scripts/deploy.ps1 -ApiOnly        # backend only
    ./scripts/deploy.ps1 -WebOnly        # storefront only
    ./scripts/deploy.ps1 -SkipBuild      # redeploy the last build
#>
[CmdletBinding()]
param(
    [string]$SshHost = 'onetap',
    [string]$EnvFile = '.env.prod',
    [switch]$ApiOnly,
    [switch]$WebOnly,
    [switch]$PortalOnly,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
# The script lives in scripts/; every path below is repo-root relative.
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Step($m) { Write-Host "`n=== $m ===" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  !   $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "  X   $m" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------- settings --
Step "Loading $EnvFile"
if (-not (Test-Path $EnvFile)) { Die "$EnvFile not found. Copy .env.prod.example and fill it in." }

$envVars = [ordered]@{}
foreach ($line in Get-Content $EnvFile) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith('#') -or ($t -notmatch '=')) { continue }
    $k, $v = $t -split '=', 2
    $envVars[$k.Trim()] = $v.Trim().Trim('"')
}
Ok "$($envVars.Count) settings"

foreach ($required in @('NEXT_PUBLIC_API_URL', 'JWT__SECRETKEY', 'CONNECTIONSTRINGS__DEFAULT')) {
    if (-not $envVars[$required]) { Die "$required is missing from $EnvFile" }
}
if ($envVars['JWT__SECRETKEY'].Length -lt 32) { Die 'JWT__SECRETKEY must be at least 32 characters — the API refuses to start otherwise.' }
if ($envVars['JWT__SECRETKEY'] -like 'YourSuperSecretKey*') { Warn 'JWT__SECRETKEY is still the well-known default — rotate it.' }
if ($envVars['MASTERAUTH__ENABLED'] -eq 'true') { Warn 'MASTERAUTH__ENABLED=true — the master OTP bypass is live.' }

$basePath = if ($envVars['NEXT_BASE_PATH']) { $envVars['NEXT_BASE_PATH'] } else { '/web' }
$stage    = Join-Path $env:TEMP "oneweb-deploy"
$only       = $ApiOnly -or $WebOnly -or $PortalOnly
$deployApi    = (-not $only) -or $ApiOnly
$deployWeb    = (-not $only) -or $WebOnly
$deployPortal = (-not $only) -or $PortalOnly
$portalBasePath = if ($envVars['PORTAL_BASE_PATH']) { $envVars['PORTAL_BASE_PATH'] } else { '/portal' }

# Restart only the apps this run actually deployed. Restarting everything meant
# a -WebOnly deploy took the API down for the ~40s it needs to migrate and seed.
$restartList = @()
if ($deployApi)    { $restartList += 'oneweb-backend' }
if ($deployWeb)    { $restartList += 'oneweb-web' }
if ($deployPortal) { $restartList += 'oneweb-portal' }
$restartApps = $restartList -join ' '

# Only clear staging when we are rebuilding — -SkipBuild reuses what is there.
if (-not $SkipBuild) { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
if ($SkipBuild -and -not (Test-Path "$stage/api") -and -not (Test-Path "$stage/web")) {
    Die "-SkipBuild was passed but $stage has no previous build. Run without -SkipBuild."
}

# ------------------------------------------------------------------ build --
if (-not $SkipBuild) {
    if ($deployApi) {
        Step 'Building API'
        # The catalogue seed is regenerated so the deployed data matches the design.
        node scripts/export-catalog.mjs 2>&1 | Out-Null
        dotnet publish src/OneWeb.Api/OneWeb.Api.csproj -c Release -o "$stage/api" --nologo | Out-Null
        if ($LASTEXITCODE -ne 0) { Die 'dotnet publish failed' }
        # Never ship local dev settings — they carry a dev signing key.
        Remove-Item "$stage/api/appsettings.Development.json" -Force -ErrorAction SilentlyContinue
        Ok "published -> $stage/api"
    }

    if ($deployWeb) {
        Step "Building storefront (basePath=$basePath, api=$($envVars['NEXT_PUBLIC_API_URL']))"
        Push-Location website
        # NEXT_PUBLIC_* and basePath are inlined at build time, so they must be
        # set here rather than on the server.
        $env:NEXT_PUBLIC_API_URL = $envVars['NEXT_PUBLIC_API_URL']
        $env:NEXT_BASE_PATH      = $basePath
        $env:NEXT_TELEMETRY_DISABLED = '1'
        $env:NEXT_PUBLIC_CDN_URL = $envVars['NEXT_PUBLIC_CDN_URL']
        # Map + default-location settings are inlined at build time too.
        foreach ($k in @('NEXT_PUBLIC_MAPBOX_TOKEN','NEXT_PUBLIC_MAPBOX_STYLE_ID',
                         'NEXT_PUBLIC_BARIKOI_KEY','NEXT_PUBLIC_GOOGLE_MAPS_KEY',
                         'NEXT_PUBLIC_DEFAULT_LOCATION','NEXT_PUBLIC_DEFAULT_LAT',
                         'NEXT_PUBLIC_DEFAULT_LNG','NEXT_PUBLIC_GEOCODE_COUNTRY')) {
            if ($envVars[$k]) { Set-Item -Path "env:$k" -Value $envVars[$k] }
        }
        # Explicit, because `next build` also reads website/.env.local — without
        # this the developer's local flags leak into the production bundle.
        $env:NEXT_PUBLIC_SHOW_TEST_CREDENTIALS =
            if ($envVars['NEXT_PUBLIC_SHOW_TEST_CREDENTIALS']) { $envVars['NEXT_PUBLIC_SHOW_TEST_CREDENTIALS'] } else { 'false' }
        if ($env:NEXT_PUBLIC_SHOW_TEST_CREDENTIALS -eq 'true') { Warn 'Build will display test credentials publicly.' }
        if (-not (Test-Path node_modules)) { npm ci --no-audit --no-fund | Out-Null }
         npx next build --turbopack | Out-Null
        if ($LASTEXITCODE -ne 0) { Pop-Location; Die 'next build failed' }
        Pop-Location

        # `output: standalone` splits the server from static assets; reassemble.
        New-Item -ItemType Directory -Path "$stage/web" -Force | Out-Null
        Copy-Item 'website/.next/standalone/*' "$stage/web" -Recurse -Force
        New-Item -ItemType Directory -Path "$stage/web/.next" -Force | Out-Null
        Copy-Item 'website/.next/static' "$stage/web/.next/static" -Recurse -Force
        Copy-Item 'website/public' "$stage/web/public" -Recurse -Force
        Ok "built -> $stage/web"
    }

    if ($deployPortal) {
        Step "Building portal (basePath=$portalBasePath)"
        Push-Location portal
        $env:NEXT_PUBLIC_API_URL = $envVars['NEXT_PUBLIC_API_URL']
        $env:NEXT_BASE_PATH      = $portalBasePath
        $env:NEXT_PUBLIC_CDN_PORTAL_URL = $envVars['NEXT_PUBLIC_CDN_PORTAL_URL']
        # Inlined so middleware redirects carry the /portal prefix.
        $env:NEXT_PUBLIC_BASE_PATH = $portalBasePath
        $env:NEXT_TELEMETRY_DISABLED = '1'
        if (-not (Test-Path node_modules)) { npm install --no-audit --no-fund | Out-Null }
         npx next build --turbopack | Out-Null
        if ($LASTEXITCODE -ne 0) { Pop-Location; Die 'portal build failed' }
        Pop-Location

        New-Item -ItemType Directory -Path "$stage/portal" -Force | Out-Null
        Copy-Item 'portal/.next/standalone/*' "$stage/portal" -Recurse -Force
        New-Item -ItemType Directory -Path "$stage/portal/.next" -Force | Out-Null
        Copy-Item 'portal/.next/static' "$stage/portal/.next/static" -Recurse -Force
        if (Test-Path 'portal/public') { Copy-Item 'portal/public' "$stage/portal/public" -Recurse -Force }
        Ok "built -> $stage/portal"
    }
}

# ---------------------------------------------------------------- package --
Step 'Packaging'
Push-Location $stage
if ($deployApi -and (Test-Path 'api')) { tar czf api.tar.gz api }
if ($deployWeb -and (Test-Path 'web')) { tar czf web.tar.gz web }
if ($deployPortal -and (Test-Path 'portal')) { tar czf portal.tar.gz portal }
Pop-Location
Ok 'archives ready'

# PM2 ecosystem — env comes straight from .env.prod, so secrets never live in git.
$envJson = ($envVars.GetEnumerator() | ForEach-Object {
    $v = ($_.Value -replace '\\', '\\\\') -replace '"', '\"'
    '      "{0}": "{1}"' -f $_.Key, $v
}) -join ",`n"

$ecosystem = @"
// Generated by deploy.ps1 — do not edit by hand.
// Environment is sourced from .env.prod on the deploying machine.
module.exports = {
  apps: [
    {
      name: 'oneweb-backend',
      cwd: '/home/onetap/oneweb/publish',
      // Run through bash: pointing PM2 straight at the dll makes it try to
      // exec the file itself ("cannot execute binary file").
      script: 'bash',
      args: ['-c', 'exec dotnet OneWeb.Api.dll'],
      interpreter: 'none',
      env: {
        ASPNETCORE_URLS: 'http://127.0.0.1:5102',
$envJson
      }
    },
    {
      name: 'oneweb-web',
      cwd: '/home/onetap/oneweb/web',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOSTNAME: '127.0.0.1'
      }
    },
    {
      name: 'oneweb-portal',
      cwd: '/home/onetap/oneweb/portal',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOSTNAME: '127.0.0.1'
      }
    }
  ]
}
"@
Set-Content -Path "$stage/ecosystem.config.js" -Value $ecosystem -Encoding UTF8

# nginx: storefront at /web, API already proxied at /api/.
$nginxSnippet = @'
    # OneTap admin/vendor portal (Next.js, basePath=/portal)
    location /portal {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OneTap storefront (Next.js, basePath=/web)
    location /web {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
'@
Set-Content -Path "$stage/nginx-locations.conf" -Value $nginxSnippet -Encoding UTF8

# Idempotent inserter: adds our locations before nginx's catch-all "location /".
$nginxInsert = @'
import pathlib, sys
target = pathlib.Path('/etc/nginx/sites-available/default')
snippet = pathlib.Path(sys.argv[1]).read_text()
cfg = target.read_text()
if 'location /portal' in cfg and 'location /web' in cfg:
    print('  nginx locations already present')
    raise SystemExit(0)
# Drop earlier OneTap blocks line-by-line (no regex: newline escapes do not
# survive PowerShell here-strings reliably) so the snippet stays authoritative.
lines = cfg.splitlines(keepends=True)
kept, skipping, depth = [], False, 0
for line in lines:
    if not skipping and line.lstrip().startswith('# OneTap '):
        skipping, depth = True, 0
        continue
    if skipping:
        depth += line.count('{') - line.count('}')
        if depth <= 0 and '}' in line:
            skipping = False
        continue
    kept.append(line)
cfg = ''.join(kept)
i = cfg.index('    location / {')
target.write_text(cfg[:i] + snippet + cfg[i:])
print('  nginx locations inserted')
'@
Set-Content -Path "$stage/nginx-insert.py" -Value $nginxInsert -Encoding UTF8

# ----------------------------------------------------------------- upload --
Step "Uploading to $SshHost"
# Wipe staging first: a leftover archive from a previous run would make a
# -WebOnly deploy redeploy the API too.
ssh $SshHost 'rm -rf ~/deploy-staging && mkdir -p ~/deploy-staging' | Out-Null
$files = @("$stage/ecosystem.config.js", "$stage/nginx-locations.conf", "$stage/nginx-insert.py")
if ($deployApi) { $files += "$stage/api.tar.gz" }
if ($deployWeb) { $files += "$stage/web.tar.gz" }
if ($deployPortal) { $files += "$stage/portal.tar.gz" }
scp -q $files "${SshHost}:~/deploy-staging/"
if ($LASTEXITCODE -ne 0) { Die 'upload failed' }
Ok 'uploaded'

# ------------------------------------------------------------------ apply --
Step 'Applying on server'
$remote = @"
set -e
cd ~/deploy-staging

if [ -f api.tar.gz ]; then
  rm -rf publish.new && mkdir -p publish.new
  tar xzf api.tar.gz -C publish.new --strip-components=1
  # Keep one rollback copy, then replace the target outright. `mv` onto an
  # existing directory moves *into* it, so the old tree must go first.
  sudo rm -rf /home/onetap/oneweb/publish.old
  if [ -d /home/onetap/oneweb/publish ]; then
    sudo mv /home/onetap/oneweb/publish /home/onetap/oneweb/publish.old
  fi
  sudo rm -rf /home/onetap/oneweb/publish
  sudo mv publish.new /home/onetap/oneweb/publish
  sudo chown -R onetap:onetap /home/onetap/oneweb/publish
  echo "  api files in place"
fi

if [ -f portal.tar.gz ]; then
  rm -rf portal.new && mkdir -p portal.new
  tar xzf portal.tar.gz -C portal.new --strip-components=1
  sudo rm -rf /home/onetap/oneweb/portal
  sudo mv portal.new /home/onetap/oneweb/portal
  sudo chown -R onetap:onetap /home/onetap/oneweb/portal
  echo "  portal files in place"
fi

if [ -f web.tar.gz ]; then
  rm -rf web.new && mkdir -p web.new
  tar xzf web.tar.gz -C web.new --strip-components=1
  sudo rm -rf /home/onetap/oneweb/web
  sudo mv web.new /home/onetap/oneweb/web
  sudo chown -R onetap:onetap /home/onetap/oneweb/web
  echo "  web files in place"
fi

sudo cp ecosystem.config.js /home/onetap/oneweb/ecosystem.config.js
sudo chown onetap:onetap /home/onetap/oneweb/ecosystem.config.js
sudo chmod 600 /home/onetap/oneweb/ecosystem.config.js

# nginx: insert the location blocks once, from the uploaded snippet.
# Done via a file + python script because quoting nginx variables through
# PowerShell -> ssh -> bash -> python inline is unreliable. NOTE: this whole
# block is an expandable here-string, so a bare dollar-sign would be swallowed
# by PowerShell as a variable — keep them out of it.
sudo python3 ~/deploy-staging/nginx-insert.py ~/deploy-staging/nginx-locations.conf

sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx && echo "  nginx reloaded"

# Old single-app registrations are replaced by the ecosystem file.
sudo su - onetap -c "pm2 delete oneweb-frontend >/dev/null 2>&1 || true"
sudo su - onetap -c "cd /home/onetap/oneweb && pm2 startOrRestart ecosystem.config.js --update-env --only '$restartApps'"
sudo su - onetap -c "pm2 save >/dev/null 2>&1 || true"
echo "  pm2 reloaded"
"@
# PowerShell here-strings use CRLF; bash treats the stray \r as part of each
# command ("set: - : invalid option", "cd: …\r: No such file"). Normalise first.
($remote -replace "`r`n", "`n") | ssh $SshHost 'bash -s'
if ($LASTEXITCODE -ne 0) { Die 'remote apply failed' }

# ------------------------------------------------------------------ verify --
Step 'Verifying'

# The API runs migrations and seeding on boot, so a single probe right after the
# restart reports a false 502. Poll until it is genuinely up (or genuinely down).
function Wait-Endpoint {
    param([string]$Url, [int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $last = 0
    do {
        try {
            $r = Invoke-WebRequest -Uri $Url -TimeoutSec 15 -SkipHttpErrorCheck -MaximumRedirection 3
            $last = [int]$r.StatusCode
            if ($last -ge 200 -and $last -lt 400) { return $last }
        } catch { $last = 0 }
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)
    return $last
}

Start-Sleep -Seconds 5
$base = ($envVars['NEXT_PUBLIC_API_URL']).TrimEnd('/')
$checks = @(
    @{ Name = 'API  /api/v1/services/categories'; Url = "$base/api/v1/services/categories" },
    @{ Name = 'Swagger';                          Url = "$base/swagger/index.html" },
    @{ Name = "Site $basePath";                   Url = "$base$basePath" },
    @{ Name = "Portal $portalBasePath";           Url = "$base$portalBasePath" }
)
$failed = 0
foreach ($c in $checks) {
    $code = Wait-Endpoint -Url $c.Url
    if ($code -ge 200 -and $code -lt 400) { Ok "$($c.Name) -> $code" }
    elseif ($code -eq 0) { Warn "$($c.Name) -> unreachable"; $failed++ }
    else { Warn "$($c.Name) -> $code"; $failed++ }
}

if ($failed -gt 0) {
    Warn "$failed check(s) failed. Logs:  ssh $SshHost 'sudo su - onetap -c `"pm2 logs --lines 50`"'"
    exit 1
}
Write-Host "`nDeployed.  Site $base$basePath   Portal $base$portalBasePath   API $base/api/v1" -ForegroundColor Green
