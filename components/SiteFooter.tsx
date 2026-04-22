import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href="/privacy"
            className="hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="hover:text-white transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors"
          >
            Terms
          </Link>
        </div>

        <div className="mt-2">© {new Date().getFullYear()} CardCat. All rights reserved.</div>
      </div>
    </footer>
  );
}
