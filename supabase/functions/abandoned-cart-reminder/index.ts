import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CartItem {
  nombre: string;
  ubicacion: string;
  precio: number;
  fechaInicio: string;
  fechaFin: string;
}

interface AbandonedCart {
  user_id: string;
  items: CartItem[];
  last_activity_at: string;
  reminder_count: number;
}

interface UserProfile {
  email: string;
  name: string | null;
}

async function sendReminderEmail(
  email: string,
  name: string | null,
  items: CartItem[],
  totalPrice: number
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY not configured");
    return false;
  }

  const itemsList = items
    .map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0;">
          <strong>${item.nombre}</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">${item.ubicacion}</span>
        </td>
        <td style="padding: 12px 0; text-align: right;">
          $${item.precio.toLocaleString("es-MX")} MXN
        </td>
      </tr>
    `)
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #2563eb; margin: 0;">AdAvailable</h1>
        <p style="color: #6b7280; margin-top: 8px;">Tu plataforma de publicidad exterior</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0;">¡Hola${name ? ` ${name}` : ''}!</h2>
        <p style="margin: 0; opacity: 0.9;">Notamos que dejaste algunas pantallas en tu carrito.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; color: #374151;">Tu selección pendiente:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsList}
          <tr>
            <td style="padding: 16px 0; font-weight: 600; font-size: 18px;">Total estimado:</td>
            <td style="padding: 16px 0; text-align: right; font-weight: 700; font-size: 20px; color: #2563eb;">
              $${totalPrice.toLocaleString("es-MX")} MXN
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://adavailable.lovable.app/explorar" 
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Completar mi reserva
        </a>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⚠️ Importante:</strong> Las pantallas seleccionadas pueden ser reservadas por otros anunciantes en cualquier momento. 
          Te recomendamos completar tu reserva lo antes posible.
        </p>
      </div>
      
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p>Este correo fue enviado por AdAvailable.</p>
        <p>Si no deseas recibir estos recordatorios, puedes vaciar tu carrito o completar la reserva.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: "carlos@adavailable.com", name: "AdAvailable" },
        subject: `🛒 ¡No olvides tu selección! ${items.length} pantalla${items.length !== 1 ? 's' : ''} esperando`,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return false;
    }

    console.log(`Reminder email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find abandoned carts (last activity > 24 hours ago, not reminded in last 48 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    console.log(`Looking for abandoned carts with last_activity_at < ${twentyFourHoursAgo}`);

    // Get abandoned carts with items
    const { data: abandonedCarts, error: cartsError } = await supabase
      .from("user_carts")
      .select("user_id, items, last_activity_at, reminder_count, reminder_sent_at")
      .lt("last_activity_at", twentyFourHoursAgo)
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${fortyEightHoursAgo}`)
      .lt("reminder_count", 3); // Max 3 reminders

    if (cartsError) {
      console.error("Error fetching abandoned carts:", cartsError);
      throw cartsError;
    }

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts`);

    // Filter carts with actual items
    const cartsWithItems = (abandonedCarts || []).filter(
      cart => Array.isArray(cart.items) && cart.items.length > 0
    );

    console.log(`${cartsWithItems.length} carts have items`);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const cart of cartsWithItems) {
      // Get user profile for email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", cart.user_id)
        .single();

      if (profileError || !profile?.email) {
        console.log(`No email found for user ${cart.user_id}`);
        continue;
      }

      const items = cart.items as CartItem[];
      const totalPrice = items.reduce((sum, item) => sum + (item.precio || 0), 0);

      // Send reminder email
      const success = await sendReminderEmail(
        profile.email,
        profile.name,
        items,
        totalPrice
      );

      if (success) {
        // Update reminder tracking
        await supabase
          .from("user_carts")
          .update({
            reminder_sent_at: new Date().toISOString(),
            reminder_count: (cart.reminder_count || 0) + 1,
          })
          .eq("user_id", cart.user_id);

        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    const result = {
      processed: cartsWithItems.length,
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    };

    console.log("Abandoned cart reminder job completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in abandoned-cart-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
