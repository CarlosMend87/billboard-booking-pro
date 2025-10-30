import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ReservationEmailRequest {
  email: string;
  reservations: Array<{
    id: string;
    asset_name: string;
    asset_type: string;
    modalidad: string;
    precio_total: number;
    fecha_inicio: string;
    fecha_fin: string;
    config: any;
    owner_id: string;
  }>;
  total: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, reservations, total }: ReservationEmailRequest = await req.json();

    console.log("Processing reservation confirmation email for:", email);

    // Send email to advertiser
    await sendEmailToAdvertiser(email, reservations, total);
    
    // Group reservations by owner and send emails to each owner
    const ownerReservations = new Map<string, typeof reservations>();
    
    for (const reservation of reservations) {
      const ownerId = reservation.owner_id;
      if (!ownerReservations.has(ownerId)) {
        ownerReservations.set(ownerId, []);
      }
      ownerReservations.get(ownerId)!.push(reservation);
    }
    
    // Send emails to all owners
    for (const [ownerId, ownerReservs] of ownerReservations) {
      await sendEmailToOwner(ownerId, ownerReservs);
    }

    console.log("All confirmation emails sent successfully");

    return new Response(JSON.stringify({ success: true, message: "Emails sent to advertiser and owners" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendEmailToAdvertiser(email: string, reservations: any[], total: number): Promise<void> {
  const reservationItems = reservations.map(res => `
    <div style="border-bottom: 1px solid #e5e5e5; padding: 12px 0;">
      <strong>${res.asset_name}</strong> (ID: ${res.id.slice(-6)})<br>
      <span style="color: #666;">Tipo: ${res.asset_type} | Modalidad: ${res.modalidad}</span><br>
      <span style="color: #666;">Fechas: ${res.fecha_inicio} al ${res.fecha_fin}</span><br>
      <strong style="color: #2563eb;">Precio: $${res.precio_total.toFixed(2)} MXN</strong>
    </div>
  `).join('');

  const { error } = await resend.emails.send({
    from: 'Sistema de Reservas <onboarding@resend.dev>',
    to: [email],
    subject: '✅ Confirmación de Reservas - Resumen de tu Selección',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Reservas Confirmadas!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola,</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Hemos recibido tu solicitud de reserva exitosamente. A continuación encontrarás el resumen completo:
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📋 Resumen de Reservas:</h3>
            ${reservationItems}
            
            <div style="text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; padding-top: 15px; border-top: 2px solid #2563eb; color: #2563eb;">
              Total: $${total.toFixed(2)} MXN
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>⏳ Estado HOLD - 48 horas:</strong><br>
              Tus reservas están en estado HOLD por las próximas 48 horas. Los propietarios han recibido tu solicitud y te notificaremos cuando la acepten o rechacen.
            </p>
          </div>
          
          <p style="font-size: 16px; margin-top: 25px;">
            Recibirás notificaciones por correo sobre el estado de cada reserva.
          </p>
          
          <p style="font-size: 16px; margin-top: 25px;">
            ¡Gracias por confiar en nosotros! 🎉
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 14px;">
            <p>El Equipo de Reservas</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  if (error) {
    console.error('Error sending email to advertiser:', error);
    throw error;
  }
  
  console.log('Email sent successfully to advertiser:', email);
}

async function sendEmailToOwner(ownerId: string, reservations: any[]): Promise<void> {
  // Get owner email from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('user_id', ownerId)
    .single();

  if (profileError || !profile?.email) {
    console.error(`Could not find email for owner ${ownerId}:`, profileError);
    return;
  }

  const reservationItems = reservations.map(res => `
    <div style="border-bottom: 1px solid #e5e5e5; padding: 12px 0;">
      <strong>${res.asset_name}</strong> (ID: ${res.id.slice(-6)})<br>
      <span style="color: #666;">Tipo: ${res.asset_type} | Modalidad: ${res.modalidad}</span><br>
      <span style="color: #666;">Fechas: ${res.fecha_inicio} al ${res.fecha_fin}</span><br>
      <strong style="color: #10b981;">Precio: $${res.precio_total.toFixed(2)} MXN</strong>
    </div>
  `).join('');

  const total = reservations.reduce((sum, res) => sum + res.precio_total, 0);

  const { error } = await resend.emails.send({
    from: 'Sistema de Reservas <onboarding@resend.dev>',
    to: [profile.email],
    subject: '🔔 Nueva Solicitud de Reserva - Acción Requerida',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Nueva Solicitud de Reserva!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${profile.name || 'Propietario'},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Has recibido una nueva solicitud de reserva para tus espacios publicitarios:
          </p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #064e3b; margin-top: 0;">📋 Detalles de la Solicitud:</h3>
            ${reservationItems}
            
            <div style="text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; padding-top: 15px; border-top: 2px solid #10b981; color: #10b981;">
              Total: $${total.toFixed(2)} MXN
            </div>
          </div>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af;">
              <strong>⏰ Acción Requerida:</strong><br>
              Por favor, revisa y responde a esta solicitud en las próximas 48 horas. Puedes aceptar o rechazar la reserva desde tu panel de control.
            </p>
          </div>
          
          <p style="font-size: 16px; margin-top: 25px;">
            Ingresa a tu panel para gestionar esta solicitud.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 14px;">
            <p>El Equipo de Reservas</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  if (error) {
    console.error(`Error sending email to owner ${ownerId}:`, error);
    throw error;
  }
  
  console.log(`Email sent successfully to owner: ${profile.email}`);
}

serve(handler);