import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import ListingsSharedView from "@/components/ListingsSharedView";

export default async function ListedSharePage({ params }: { params: { token: string } }) {
  if (!supabaseAdmin) notFound();

  const token = params.token;

  const { data: share, error: shareErr } = await supabaseAdmin
    .from("listing_shares")
    .select("share_token, owner_user_id, expires_at, revoked_at, show_pricing")
    .eq("share_token", token)
    .maybeSingle();

  if (shareErr || !share) {
    notFound();
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

  const { data: cards, error: cardsErr } = await supabaseAdmin
    .from("cards")
    .select(
      "id, player_name, year, brand, set_name, parallel, card_number, serial_number_text, grading_company, auto_grade, grading_cert_number_text, graded, grade, image_url, back_image_url, asking_price, sale_platform"
    )
    .eq("user_id", share.owner_user_id)
    .eq("status", "Listed");

  if (cardsErr) {
    notFound();
  }

  return <ListingsSharedView token={token} showPricing={Boolean(share.show_pricing)} cards={(cards ?? []) as any} />;
}
