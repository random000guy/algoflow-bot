import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  condition: string;
  target_price: number | null;
  is_active: boolean;
}

interface UserProfile {
  email: string;
  full_name: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const { symbol, currentPrice } = await req.json();

    console.log(`Checking alerts for ${symbol} at price ${currentPrice}`);

    // Fetch active alerts for this symbol
    const { data: alerts, error: alertsError } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("symbol", symbol)
      .eq("is_active", true);

    if (alertsError) {
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active alerts found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const triggeredAlerts: PriceAlert[] = [];

    // Check which alerts should be triggered
    for (const alert of alerts as PriceAlert[]) {
      let shouldTrigger = false;

      if (alert.target_price) {
        switch (alert.condition) {
          case "above":
            shouldTrigger = currentPrice > alert.target_price;
            break;
          case "below":
            shouldTrigger = currentPrice < alert.target_price;
            break;
          case "equals":
            shouldTrigger = Math.abs(currentPrice - alert.target_price) < 0.01;
            break;
        }
      }

      if (shouldTrigger) {
        triggeredAlerts.push(alert);
      }
    }

    console.log(`Found ${triggeredAlerts.length} triggered alerts`);

    // Process triggered alerts
    for (const alert of triggeredAlerts) {
      // Get user email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", alert.user_id)
        .single();

      if (profileError || !profile) {
        console.error(`Failed to get profile for user ${alert.user_id}`);
        continue;
      }

      const userProfile = profile as UserProfile;

      // Send email notification
      try {
        const emailResponse = await resend.emails.send({
          from: "Price Alerts <onboarding@resend.dev>",
          to: [userProfile.email],
          subject: `Price Alert: ${alert.symbol} ${alert.condition} $${alert.target_price}`,
          html: `
            <h1>Price Alert Triggered!</h1>
            <p>Hello ${userProfile.full_name || "Trader"},</p>
            <p>Your price alert for <strong>${alert.symbol}</strong> has been triggered.</p>
            <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
              <h2 style="margin: 0 0 10px 0;">Alert Details</h2>
              <p style="margin: 5px 0;"><strong>Symbol:</strong> ${alert.symbol}</p>
              <p style="margin: 5px 0;"><strong>Condition:</strong> ${alert.condition}</p>
              <p style="margin: 5px 0;"><strong>Target Price:</strong> $${alert.target_price}</p>
              <p style="margin: 5px 0;"><strong>Current Price:</strong> $${currentPrice}</p>
              <p style="margin: 5px 0;"><strong>Alert Type:</strong> ${alert.alert_type}</p>
            </div>
            <p>This alert has been automatically disabled. You can reactivate it from your dashboard.</p>
            <p>Best regards,<br>Your Trading Platform</p>
          `,
        });

        console.log(`Email sent to ${userProfile.email}:`, emailResponse);

        // Mark alert as triggered and inactive
        await supabase
          .from("price_alerts")
          .update({
            is_active: false,
            triggered_at: new Date().toISOString(),
          })
          .eq("id", alert.id);

        console.log(`Alert ${alert.id} marked as triggered`);
      } catch (emailError) {
        console.error(`Failed to send email for alert ${alert.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Price alerts processed",
        triggeredCount: triggeredAlerts.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-price-alerts function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
