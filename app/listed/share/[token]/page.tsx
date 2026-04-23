import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import ListingsSharedView from "@/components/ListingsSharedView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListedSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  try {
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

    const { token: tokenParam } = await params;
    const rawToken = String(tokenParam || "");
    const token = rawToken.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    let { data: share, error: shareErr } = await supabaseAdmin
      .from("listing_shares")
      .select("created_at, expires_at, revoked_at, show_pricing, show_comp_check")
      .eq("share_token", token)
      .maybeSingle();

    if (shareErr && String(shareErr.message || "").toLowerCase().includes("show_comp_check")) {
      const fallback = await supabaseAdmin
        .from("listing_shares")
        .select("created_at, expires_at, revoked_at, show_pricing")
        .eq("share_token", token)
        .maybeSingle();
      share = fallback.data ? ({ ...fallback.data, show_comp_check: false } as any) : fallback.data;
      shareErr = fallback.error;
    }

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
      // Extra sanity checks: debugging why debug endpoint finds the token but this page doesn’t.
      let foundByRaw = false;
      let foundByNormalized = false;
      try {
        const rawRes = await supabaseAdmin
          .from("listing_shares")
          .select("share_token")
          .eq("share_token", rawToken)
          .maybeSingle();
        foundByRaw = Boolean((rawRes.data as any) ?? null);

        const normRes = await supabaseAdmin
          .from("listing_shares")
          .select("share_token")
          .eq("share_token", token)
          .maybeSingle();
        foundByNormalized = Boolean((normRes.data as any) ?? null);
      } catch {
        // ignore
      }

      return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold">Invalid share link</h1>
            <p className="mt-3 text-slate-300">
              Ask the lister to generate a new shared listings link.
              <br />
              Debug: foundByRaw={String(foundByRaw)} foundByNormalized={String(foundByNormalized)} rawLen={rawToken.length} normLen={token.length}
            </p>
          </div>
        </main>
      );
    }

    if ((share as any).revoked_at) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold">Share disabled</h1>
            <p className="mt-3 text-slate-300">The lister disabled this shared listings link. Ask for a fresh link.</p>
          </div>
        </main>
      );
    }

    if ((share as any).expires_at) {
      const exp = new Date((share as any).expires_at);
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
    let ownerUsername: string | null = null;

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

    try {
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles")
        .select("username, allow_messages")
        .eq("id", ownerUserId)
        .maybeSingle();

      if ((ownerProfile as any)?.allow_messages !== false) {
        ownerUsername = String((ownerProfile as any)?.username || "").trim() || null;
      }
    } catch {
      ownerUsername = null;
    }

    const richCardsSelect =
      "id, player_name, year, brand, set_name, parallel, card_number, team, sport, competition, rookie, is_autograph, has_memorabilia, serial_number_text, graded, grade, grading_company, auto_grade, grading_cert_number_text, estimated_price, image_url, back_image_url, asking_price, sale_platform";
    const fallbackCardsSelect =
      "id, player_name, year, brand, set_name, parallel, card_number, team, sport, competition, rookie, is_autograph, has_memorabilia, serial_number_text, graded, grade, estimated_price, image_url, back_image_url, asking_price, sale_platform";

    let cards: any[] | null = null;
    let cardsErr: any = null;

    const richCardsRes = await supabaseAdmin
      .from("cards")
      .select(richCardsSelect)
      .eq("user_id", ownerUserId)
      .eq("status", "Listed");

    cards = richCardsRes.data as any[] | null;
    cardsErr = richCardsRes.error;

    if (cardsErr && String(cardsErr.message || "").toLowerCase().includes("does not exist")) {
      const fallbackCardsRes = await supabaseAdmin
        .from("cards")
        .select(fallbackCardsSelect)
        .eq("user_id", ownerUserId)
        .eq("status", "Listed");

      cards = fallbackCardsRes.data as any[] | null;
      cardsErr = fallbackCardsRes.error;
    }

    if (cardsErr) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold">Couldn’t load listings</h1>
            <p className="mt-3 text-slate-300">{String(cardsErr.message || cardsErr)}</p>
          </div>
        </main>
      );
    }

    return (
      <ListingsSharedView
        token={token}
        showPricing={Boolean((share as any)?.show_pricing)}
        showCompCheck={Boolean((share as any)?.show_comp_check)}
        ownerUsername={ownerUsername}
        cards={(cards ?? []) as any}
      />
    );
  } catch (err) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold">Server error</h1>
          <p className="mt-3 text-slate-300">{String(err)}</p>
        </div>
      </main>
    );
  }
}
