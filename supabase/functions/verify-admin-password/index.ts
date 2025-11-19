import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { password, userId } = await req.json();

    console.log(`Verifying admin password for user ${userId}`);

    // Verify password
    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Invalid admin password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update pending user status
    const { error: pendingError } = await supabase
      .from("pending_users")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId, // Self-approved with admin password
      })
      .eq("user_id", userId);

    if (pendingError) {
      throw pendingError;
    }

    console.log(`User ${userId} approved via admin password`);

    return new Response(
      JSON.stringify({ success: true, message: "Access granted" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-admin-password function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
