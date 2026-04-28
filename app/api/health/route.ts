export async function GET() {
  const has = (v: unknown) => (typeof v === "string" && v.length > 0 ? true : false);

  return Response.json({
    ok: true,
    at: new Date().toISOString(),
    vercel: {
      gitCommitSha:
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
    env: {
      NEXT_PUBLIC_PWA_ENABLED: process.env.NEXT_PUBLIC_PWA_ENABLED ?? null,
      NEXT_PUBLIC_SUPABASE_URL: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
      STRIPE_SECRET_KEY: has(process.env.STRIPE_SECRET_KEY),
    },
  });
}

