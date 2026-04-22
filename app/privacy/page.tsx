import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Privacy Policy | CardCat",
  description: "CardCat privacy policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.35)] sm:p-8">
          <h1 className="text-3xl font-black tracking-[-0.03em]">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Effective date: <span className="font-semibold">2026-04-21</span>
            <br />
            Please note: this is a template. You should review it with legal counsel and
            update placeholders before publishing.
          </p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-200">
            <div>
              <h2 className="text-base font-bold text-white">1. Who we are</h2>
              <p className="mt-2">
                CardCat (“we”, “us”, “our”) is the operator of the CardCat website and
                services. References to “you” include visitors and registered users.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">2. Information we collect</h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Account and profile data:</span> details you
                  provide when creating an account.
                </li>
                <li>
                  <span className="font-semibold">Billing information:</span> payment details are
                  handled by Stripe. We receive subscription/billing status needed to provide
                  access.
                </li>
                <li>
                  <span className="font-semibold">Content you create:</span> card listings,
                  inventory entries, and other information you submit.
                </li>
                <li>
                  <span className="font-semibold">Technical data:</span> basic usage and device
                  data (e.g., pages visited, timestamps) logged by our systems.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">3. How we use information</h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Provide, maintain, and improve the service.</li>
                <li>Enable subscriptions and manage access.</li>
                <li>Communicate with you about your account and service.</li>
                <li>Prevent fraud, abuse, and security incidents.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">4. Sharing and disclosure</h2>
              <p className="mt-2">
                We may share information with service providers that help us operate the
                service (for example, hosting, analytics, and billing). We do not sell your
                personal information.
              </p>
              <p className="mt-2">
                <span className="font-semibold">Stripe:</span> Stripe processes payments and
                related billing events. See Stripe’s privacy practices.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">5. Data security</h2>
              <p className="mt-2">
                We use reasonable administrative, technical, and organizational safeguards to
                protect information. No method of transmission or storage is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">6. Your choices and rights</h2>
              <p className="mt-2">
                Depending on where you live, you may have rights to access, correct,
                or delete certain information. To exercise rights, contact us at
                <span className="font-semibold">support@cardcat.io</span>.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">7. International transfers</h2>
              <p className="mt-2">
                We may store and process information in countries where our service providers
                operate. Laws regarding data protection may differ from those in your country.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">8. Contact us</h2>
              <p className="mt-2">
                Questions about this policy should be sent to
                <span className="font-semibold">support@cardcat.io</span>.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
