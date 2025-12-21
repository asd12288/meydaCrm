import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  username: string;
  password: string;
  displayName: string;
  role: "admin" | "sales" | "developer";
}

// Available avatar IDs (1-54)
const AVATAR_COUNT = 54;

function getRandomAvatarId(): string {
  const randomIndex = Math.floor(Math.random() * AVATAR_COUNT) + 1;
  return `avatar-${randomIndex.toString().padStart(2, "0")}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // SECURITY: Verify caller is admin - Authorization header is REQUIRED
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autorisation requise" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "admin" && callerProfile?.role !== "developer") {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { username, password, displayName, role }: CreateUserRequest =
      await req.json();

    if (!username || !password || !displayName || !role) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create fake email from username
    const email = `${username.toLowerCase().replace(/\s+/g, ".")}@crm.local`;

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm since we don't use real emails
        user_metadata: {
          username,
          display_name: displayName,
          role,
        },
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Profile is created automatically by trigger, but let's update it with correct values
    // Also assign a random avatar to the new user
    const avatar = getRandomAvatarId();
    if (authData.user) {
      await supabaseAdmin
        .from("profiles")
        .update({
          role,
          display_name: displayName,
          avatar,
        })
        .eq("id", authData.user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user?.id,
          email,
          username,
          displayName,
          role,
          avatar,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
