"use client";

import { useMemo, useState } from "react";

import MarketingNav from "@/components/MarketingNav";
import CardCatLogo from "@/components/CardCatLogo";

// Support email used for the contact mailto link (so messages can be filtered by subject).
const SUPPORT_EMAIL = "support@cardcat.io";

type SubjectKey =
  | "feedback"
  | "billing"
  | "technical"
  | "data-privacy"
  | "bug"
  | "other";

// Subject templates (used to prefill the email body)
const SUBJECTS: Array<{ key: SubjectKey; label: string; template: string }> =
  [
    {
      key: "feedback",
      label: "Feedback / UX improvements",
      template:
        "Hi CardCat team,\n\nI’d love to share some ideas to improve the CardCat experience for collectors:\n\n• What’s working:\n\n• What’s not:\n\n• My suggestion:\n\n\nThanks!",
    },
    {
      key: "billing",
      label: "Billing / subscription",
      template:
        "Hi CardCat team,\n\nI have a question about billing/subscriptions:\n\n• Plan (Collector/Pro):\n• What I expected:\n• What happened instead:\n\n\nThanks!",
    },
    {
      key: "technical",
      label: "Technical issue",
      template:
        "Hi CardCat team,\n\nI’m running into a technical issue:\n\n• What I was trying to do:\n• Steps to reproduce:\n• Any error messages/screenshots (describe here):\n\n\nThanks!",
    },
    {
      key: "data-privacy",
      label: "Data / privacy",
      template:
        "Hi CardCat team,\n\nI have a data/privacy question:\n\n• What data is involved:\n• What I’m requesting (access/delete/etc.):\n\n\nThanks!",
    },
    {
      key: "bug",
      label: "Bug report",
      template:
        "Hi CardCat team,\n\nBug report:\n\n• Expected behavior:\n• Actual behavior:\n• Steps to reproduce:\n• Platform/device/browser:\n\n\nThanks!",
    },
    {
      key: "other",
      label: "Other / general question",
      template: "Hi CardCat team,\n\nMy question/concern is:\n\n\nThanks!",
    },
  ];

export default function ContactPage() {
  const [subject, setSubject] = useState<SubjectKey>("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(() =>
    SUBJECTS.find((s) => s.key === "feedback")!.template
  );
  // Honeypot: bots often fill this; real users won’t.
  const [honeypot, setHoneypot] = useState("");

  const subjectMeta = useMemo(
    () => SUBJECTS.find((s) => s.key === subject)!,
    [subject]
  );

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function submitContact() {
    setSending(true);
    setSent(false);
    setSendError(null);
    try {
      const resp = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectLabel: subjectMeta.label,
          name,
          email,
          message,
          honeypot,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || "Failed to send message");
      }

      setName("");
      setEmail("");
      setMessage(subjectMeta.template);
      setHoneypot("");
      setSent(true);
      // keep subject as-is
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      setSent(false);
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }

  function maybePrefill(nextSubject: SubjectKey) {
    setSubject(nextSubject);
    setMessage((prev) => {
      const prevTemplate = SUBJECTS.find((s) => s.key === subject)!.template;
      if (
        prev.trim().length > 0 &&
        prev.trim() !== prevTemplate.trim()
      )
        return prev;

      const nextTemplate = SUBJECTS.find((s) => s.key === nextSubject)!.template;
      return nextTemplate;
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <MarketingNav />

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="mb-4">
            <div className="hidden sm:block">
              <CardCatLogo variant="horizontal" size="md" />
            </div>
            <div className="sm:hidden">
              <CardCatLogo variant="icon" size="md" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.03em]">Contact Us</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            CardCat is built for collectors, and we’re constantly trying to improve the
            experience. If you have feedback, run into an issue, or have an idea, send
            us a note. We read everything.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            {/* Honeypot field (hidden) */}
            <input
              type="text"
              name="honeypot"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sending) submitContact();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => maybePrefill(e.target.value as SubjectKey)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Your name (optional)
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                    placeholder="Jane / Sam"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Your email (required)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                    placeholder="you@example.com"
                    inputMode="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 min-h-44 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="text-xs leading-5 text-slate-400">
                Submitting sends your message directly to{" "}
                <span className="font-semibold text-slate-200">{SUPPORT_EMAIL}</span>.
                We include the dropdown subject so you can filter easily.
              </div>

              {sendError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {sendError}
                </div>
              ) : null}
              {sending ? (
                <div className="text-xs text-slate-400">Sending…</div>
              ) : null}
              {sent ? (
                <div className="text-xs text-emerald-200">
                  Sent! Check your inbox in a minute.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={sending || sent}
                  className="rounded-xl bg-[#d50000] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(213,0,0,0.28)] transition-colors hover:bg-[#b80000] disabled:opacity-60 disabled:hover:bg-[#d50000]"
                >
                  {sent ? "Sent ✓" : sending ? "Sending…" : "Send Message"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    setEmail("");
                    setHoneypot("");
                    setSent(false);
                    const feedback = SUBJECTS.find(
                      (s) => s.key === "feedback"
                    )!;
                    setSubject("feedback");
                    setMessage(feedback.template);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.08]"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 text-xs text-slate-400">
            Prefer email? Write to <span className="font-semibold">{SUPPORT_EMAIL}</span>.
          </div>
        </section>
      </div>
    </main>
  );
}
