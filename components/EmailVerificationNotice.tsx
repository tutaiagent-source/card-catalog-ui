export default function EmailVerificationNotice({
  needsVerification,
  email,
}: {
  needsVerification: boolean;
  email?: string | null;
}) {
  if (!needsVerification) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
      <div className="text-sm font-semibold">Verify your email</div>
      <div className="mt-1 text-sm text-amber-100/90">
        We sent a verification email{email ? ` to ${email}` : ""}. Please check your inbox
        (and spam folder) to confirm your account.
      </div>
    </div>
  );
}
