import { defineRailway, preserve, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "gceeverify";

export default defineRailway(() => {
  const gceeverify = service("gceeverify", {
    build: {
      builder: "RAILPACK",
      buildCommand: "npm run build",
    },
    deploy: {
      startCommand: "npm run start",
      healthcheckPath: "/api/health",
      healthcheckTimeout: 300,
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
    },
    env: {
      ADMIN_EMAILS: preserve(),
      BIGISUB_API_KEY: preserve(),
      BIGISUB_TRANSACTION_PIN: preserve(),
      BULKACC_API_KEY: preserve(),
      JAP_API_KEY: preserve(),
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
      SUPABASE_SECRET_KEY: preserve(),
    },
  });
  return project("GCEE Verify", {
    resources: [gceeverify],
  });
});
