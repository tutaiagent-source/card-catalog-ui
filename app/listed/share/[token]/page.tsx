import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import ListingsSharedView from "@/components/ListingsSharedView";

export default async function ListedSharePage({ params }: { params: { token: string } }) {
  if (!supabaseAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Share unavailable</h1>
          <p className="mt-3 text-slate-300">Server is missing Supabase service-role configuration.</p>
        </div>
      </main>
    );
  }

  const token = String(params.token || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  const { data: share, error: shareErr } = await supabaseAdmin
    .from("listing_shares")
    .select("created_at, expires_at, revoked_at, show_pricing")
    .eq("share_token", token)
    .maybeSingle();

  if (shareErr) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Share lookup error</h1>
          <p className="mt-3 text-slate-300">{String(shareErr.message || shareErr)}</p>
        </div>
      </main>
    );
  }

  if (!share) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Invalid share link</h1>
          <p className="mt-3 text-slate-300">Ask the lister to generate a new shared listings link.</p>
        </div>
      </main>
    );
  }

  if (share.revoked_at) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Share disabled</h1>
          <p className="mt-3 text-slate-300">The lister disabled this shared listings link. Ask for a fresh link.</p>
        </div>
      </main>
    );
  }

  if (share.expires_at) {
    const exp = new Date(share.expires_at);
    if (Number.isFinite(exp.getTime()) && exp.getTime() <= Date.now()) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold">Share expired</h1>
            <p className="mt-3 text-slate-300">This shared listings link has expired. Ask for a new one.</p>
          </div>
        </main>
      );
    }
  }

  const { data: ownerRow, error: ownerErr } = await supabaseAdmin
    .from("listing_shares")
    .select("owner_user_id")
    .eq("share_token", token)
    .maybeSingle();

  if (ownerErr) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Share owner lookup error</h1>
          <p className="mt-3 text-slate-300">{String(ownerErr.message || ownerErr)}</p>
        </div>
      </main>
    );
  }

  const ownerUserId = (ownerRow as any)?.owner_user_id ?? null;

  if (!ownerUserId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Share record is missing an owner</h1>
          <p className="mt-3 text-slate-300">Your `public.listing_shares` table is missing the owner user id field needed to load listings.</p>
        </div>
      </main>
    );
  }

  const { data: cards, error: cardsErr } = await supabaseAdmin
    .from("cards")
    .select(
      "id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, grading_company, auto_grade, grading_cert_number_text, graded, grade, image_url, back_image_url, asking_price, sale_platform"
    )
    .eq("user_id", ownerUserId)
    .eq("status", "Listed");

  if (cardsErr) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Couldn’t load listings</h1>
          <p className="mt-3 text-slate-300">Please try again later.</p>
        </div>
      </main>
    );
  }

  return <ListingsSharedView token={token} showPricing={Boolean((share as any)?.show_pricing)} cards={(cards ?? []) as any} />;
}
