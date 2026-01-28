import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateAgentRequest {
  email: string;
  password: string;
  nombre_completo: string;
  telefono?: string;
  codigo_agente: string;
  owner_id: string;
  rol_agente?: string;
  app_origin?: string; // Frontend origin for email links
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const resend = new Resend(resendApiKey);

    const {
      email,
      password,
      nombre_completo,
      telefono,
      codigo_agente,
      owner_id,
      rol_agente = 'supervisor',
      app_origin = 'https://adavailable.lovable.app',
    }: CreateAgentRequest = await req.json();

    console.log("Creating agent user:", { email, nombre_completo, rol_agente });

    // 1. Create user in auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: nombre_completo,
        },
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    console.log("Auth user created:", authData.user.id);

    // 2. Create agente record with role
    const { data: agenteData, error: agenteError } = await supabaseAdmin
      .from("agentes_venta")
      .insert({
        id: authData.user.id,
        owner_id,
        nombre_completo,
        email,
        telefono: telefono || null,
        codigo_agente,
        activo: true,
        rol_agente: rol_agente,
      })
      .select()
      .single();

    if (agenteError) {
      console.error("Error creating agente record:", agenteError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error al crear registro de agente: ${agenteError.message}`);
    }

    console.log("Agente record created:", agenteData.id);

    // 3. Create user_roles entry with 'agente' role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "agente",
    });

    if (roleError) {
      console.error("Error creating role:", roleError);
      // Rollback
      await supabaseAdmin.from("agentes_venta").delete().eq("id", authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error al asignar rol: ${roleError.message}`);
    }

    console.log("Role assigned successfully");

    // 4. Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        name: nombre_completo,
        role: "advertiser", // Keep as advertiser in profiles for compatibility
      })
      .eq("user_id", authData.user.id);

    if (profileError) {
      console.log("Profile update error (non-critical):", profileError);
    }

    // 5. Send email with credentials
    try {
      const dashboardUrl = `${app_origin}/agente-dashboard`;
      const emailResponse = await resend.emails.send({
        from: "AdAvailable <onboarding@resend.dev>",
        to: [email],
        subject: "Bienvenido a AdAvailable - Credenciales de Acceso",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">¡Bienvenido a AdAvailable!</h1>
            <p>Hola <strong>${nombre_completo}</strong>,</p>
            <p>Tu cuenta de agente de ventas ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Contraseña:</strong> ${password}</p>
              <p style="margin: 10px 0;"><strong>Código de Agente:</strong> ${codigo_agente}</p>
            </div>

            <p><strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.</p>
            
            <p>Puedes acceder a tu dashboard en: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
            
            <p>Si tienes alguna pregunta, no dudes en contactar a tu supervisor.</p>
            
            <p style="margin-top: 30px; color: #666;">Saludos,<br>El equipo de AdAvailable</p>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Error sending email (non-critical):", emailError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: "Agente creado exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-agent-user function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
