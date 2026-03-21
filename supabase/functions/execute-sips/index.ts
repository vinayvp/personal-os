import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const currentDay = today.getDate();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch active SIPs for today's day
    const { data: sips, error: sipError } = await (supabase as any)
      .schema("finance")
      .from("sip_configs")
      .select("*, investment:investments(*)")
      .eq("is_active", true)
      .eq("sip_day", currentDay);

    if (sipError) throw sipError;

    let executed = 0;
    let skipped = 0;

    for (const sip of sips || []) {
      // Skip if already executed this month
      if (sip.last_executed_date) {
        const lastExec = new Date(sip.last_executed_date);
        if (lastExec.getMonth() === today.getMonth() && lastExec.getFullYear() === today.getFullYear()) {
          skipped++;
          continue;
        }
      }

      // Skip if SIP has ended
      if (sip.end_date && new Date(sip.end_date) < today) {
        skipped++;
        continue;
      }

      // Insert buy transaction
      const { error: txError } = await (supabase as any)
        .schema("finance")
        .from("investment_transactions")
        .insert({
          investment_id: sip.investment_id,
          transaction_date: todayStr,
          amount_invested: sip.amount,
        });

      if (txError) {
        console.error(`SIP transaction failed for ${sip.investment_id}:`, txError);
        continue;
      }

      // Update last_executed_date
      await (supabase as any)
        .schema("finance")
        .from("sip_configs")
        .update({ last_executed_date: todayStr, updated_at: new Date().toISOString() })
        .eq("id", sip.id);

      executed++;
    }

    return new Response(
      JSON.stringify({ success: true, executed, skipped, total: (sips || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("SIP execution error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
