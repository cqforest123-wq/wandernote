import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization", { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return new Response("Invalid user", { status: 401 });
    }

    const userId = user.id;

    await admin.from("packing_lists").delete().eq("user_id", userId);
    await admin.from("trips").delete().eq("user_id", userId);

    const { error: deleteError } =
      await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return new Response(deleteError.message, { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
