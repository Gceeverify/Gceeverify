# GCEE Verify: Railway Hobby deployment

This project is prepared for a Railway Node.js service. These instructions do
not modify the existing Vercel deployment or production DNS.

## Safety gates

Before the first Railway deploy:

1. Review and apply only `supabase/migrations/20261017000000_tutorials.sql` to
   the existing Supabase project. Do not create a new Railway database.
2. Run `npm run migrate:tutorials:check` locally. It is read-only.
3. After the table exists and the dry run reports four records, run
   `npm run migrate:tutorials:apply` once. The import is idempotent and does not
   delete records.
4. Add the Railway-generated HTTPS URL to the Supabase Auth redirect allowlist.
   Keep all existing Vercel and production URLs during the parallel test.
5. Do not change PocketFi's production webhook URL until Railway has passed
   health, authentication, and read-only application tests. Never point
   PocketFi at both URLs unless duplicate delivery is intentional.

## Link the existing Railway project

The project and service have already been created. Run these commands in the
repository root if a new local checkout needs to be linked. `railway.cmd` is
used because Windows PowerShell script execution may block `railway.ps1`.

```powershell
railway.cmd login
railway.cmd whoami --json
railway.cmd link --project fa8a56dc-ff76-473c-9223-62f88f7477a0 --environment 2604a36a-d266-4913-b4dd-51e27213191f
railway.cmd service link gceeverify
railway.cmd status --json
```

Build, start, and health-check settings are managed by
`.railway/railway.ts`. Review drift before applying future configuration
changes:

```powershell
railway.cmd config plan
railway.cmd config apply
railway.cmd domain --service gceeverify --environment production --json
```

Use the generated `*.up.railway.app` hostname for `NEXT_PUBLIC_SITE_URL` and
the Supabase Auth redirect allowlist before building the Railway deployment.

## Variables

Copy the values from the existing production configuration without printing
them in the terminal or committing them. Use stdin for each secret:

```powershell
# Replace KEY with one variable name, paste its value, then press Ctrl+Z and Enter.
railway.cmd variable set KEY --stdin --service gceeverify --environment production --skip-deploys
```

Set every applicable key listed in `.env.example`. Do not set `PORT`; Railway
injects it. Do not set `BLOB_READ_WRITE_TOKEN` after the tutorial import.

For non-secret settings, normal assignments are safe:

```powershell
railway.cmd variable set NEXT_PUBLIC_SITE_URL=https://REPLACE.up.railway.app --service gceeverify --environment production --skip-deploys
railway.cmd variable set RAILPACK_NODE_VERSION=22 --service gceeverify --environment production --skip-deploys
railway.cmd variable set NUMBER_ACTIVATION_TIMEOUT_MINUTES=3 BOOST_MARKUP_PERCENT=30 LOG_MARKUP_PERCENT=30 NUMBER_MARKUP_PERCENT=30 RESELLER_MARKUP_PERCENT=30 VIRTUAL_EMAIL_MARKUP_PERCENT=300 VIRTUAL_EMAIL_LOW_PRICE_THRESHOLD_NGN=90 VIRTUAL_EMAIL_LOW_PRICE_MARKUP_PERCENT=1500 --service gceeverify --environment production --skip-deploys
```

Review variable names without revealing values:

```powershell
railway.cmd variable list --service gceeverify --environment production --json
```

## Redeploy

The command below uploads the current directory directly, so the GitHub account
connected to Railway does not need access to `Gceeverify/Gceeverify`.

```powershell
railway.cmd up --project fa8a56dc-ff76-473c-9223-62f88f7477a0 --service e2ae2af4-9c0e-47ea-b968-985ba3747348 --environment 2604a36a-d266-4913-b4dd-51e27213191f --ci --message "Deploy GCEE Verify"
```

After Railway reports `SUCCESS`, inspect and test the temporary Railway domain
before touching DNS or PocketFi:

```powershell
railway.cmd domain list --service gceeverify --environment production --json
railway.cmd deployment list --service gceeverify --environment production --limit 5 --json
railway.cmd logs --service gceeverify --environment production --lines 200 --json
```

Do not add the production custom domain or change the PocketFi webhook URL until
the temporary Railway domain has been fully verified.
