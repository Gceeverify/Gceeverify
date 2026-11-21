import { defineRailway, github, preserve, project, service } from 'railway/iac';

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = 'gceeverify';

export default defineRailway(() => {
  const gceeverify = service('gceeverify', {
    source: github('Gceeverify/Gceeverify', { branch: 'main' }),
    build: {
      builder: 'RAILPACK',
      buildCommand: 'npm run build',
    },
    deploy: {
      startCommand: 'npm run start',
      numReplicas: 1,
      sleepApplication: true,
      healthcheckPath: '/api/health',
      healthcheckTimeout: 300,
      limitOverride: {
        containers: {
          cpu: 0.5,
          memoryBytes: 536_870_912,
        },
      },
    },
    env: {
      ADMIN_EMAILS: preserve(),
      BIGISUB_API_KEY: preserve(),
      BIGISUB_TRANSACTION_PIN: preserve(),
      BULKACC_API_KEY: preserve(),
      EMAIL_FROM_ADDRESS: preserve(),
      EMAIL_FROM_NAME: preserve(),
      GMAIL_CLIENT_ID: preserve(),
      GMAIL_CLIENT_SECRET: preserve(),
      GMAIL_REFRESH_TOKEN: preserve(),
      JAP_API_KEY: preserve(),
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: preserve(),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: preserve(),
      NEXT_PUBLIC_SUPABASE_URL: preserve(),
      POCKETFI_API_KEY: preserve(),
      POCKETFI_BUSINESS_ID: preserve(),
      POCKETFI_CUSTOMER_PHONE: preserve(),
      POCKETFI_SECRET_KEY: preserve(),
      POCKETFI_VIRTUAL_ACCOUNT_BANK: preserve(),
      RAILPACK_NODE_VERSION: preserve(),
      RESELLER_API_BASE_URL: preserve(),
      RESELLER_API_KEY: preserve(),
      SMSBOWER_API_KEY: preserve(),
      SMTP_APP_PASSWORD: preserve(),
      SMTP_USER: preserve(),
      SUPABASE_SECRET_KEY: preserve(),
      VTU_PUBLIC_KEY: preserve(),
      VTU_SECRET_KEY: preserve(),
      VTU_WEBHOOK_SECRET: preserve(),
    },
  });
  return project('GCEE Verify', {
    resources: [gceeverify],
  });
});
