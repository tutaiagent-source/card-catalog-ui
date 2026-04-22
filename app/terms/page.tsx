import type { Metadata } from "next";

import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "Terms and Conditions | CardCat",
  description: "CardCat terms and conditions.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.35)] sm:p-8">
          <h1 className="text-3xl font-black tracking-[-0.03em]">Terms and Conditions</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Effective date: <span className="font-semibold">2026-04-21</span>
            <br />
            Please note: this is a template. You should review it with legal counsel and
            update placeholders before publishing.
          </p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-200">
            <div>
              <h2 className="text-base font-bold text-white">1. Agreement</h2>
              <p className="mt-2">
                By accessing or using CardCat (“Service”), you agree to these Terms and
                Conditions (“Terms”). If you do not agree, do not use the Service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">2. Eligibility</h2>
              <p className="mt-2">
                You must be able to form a binding contract in your jurisdiction to use the
                Service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">3. Accounts</h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>You are responsible for maintaining the security of your account.</li>
                <li>You agree not to share credentials or use the Service unlawfully.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">4. Subscriptions & billing</h2>
              <p className="mt-2">
                CardCat may offer subscription plans (e.g., Collector and Pro). Billing is
                processed through Stripe. Plans may renew automatically unless canceled.
              </p>
              <p className="mt-2">
                Refunds, cancellations, and invoicing policies are handled per Stripe’s billing
                rules and plan terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">5. User content</h2>
              <p className="mt-2">
                You are responsible for the accuracy, quality, and legality of the content you
                submit (including card listings and inventory entries).
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">6. Acceptable use</h2>
              <p className="mt-2">
                You agree not to misuse the Service, interfere with security, or attempt to gain
                unauthorized access.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">7. Disclaimers</h2>
              <p className="mt-2">
                The Service is provided “as is” and “as available”. We do not guarantee that
                the Service will be uninterrupted or error-free.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">8. Limitation of liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, CardCat will not be liable for indirect,
                incidental, special, consequential, or punitive damages.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">9. Termination</h2>
              <p className="mt-2">
                We may suspend or terminate access if we believe you violate these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">10. Governing law</h2>
              <p className="mt-2">
                These Terms are governed by the laws of the State of Oregon.
                Any disputes will be resolved in the appropriate courts in that jurisdiction.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">11. Contact</h2>
              <p className="mt-2">
                Questions about these Terms should be sent to
                <span className="font-semibold">support@cardcat.io</span>.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
