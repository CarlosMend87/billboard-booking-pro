import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CampaignNotificationRequest {
  reservaId: string;
  action: 'accepted' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservaId, action }: CampaignNotificationRequest = await req.json();

    console.log(`Processing ${action} notification for reserva ${reservaId}`);

    // Fetch reservation details
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .select(`
        *,
        advertiser:advertiser_id (email, name),
        owner:owner_id (email, name)
      `)
      .eq('id', reservaId)
      .single();

    if (reservaError || !reserva) {
      throw new Error('Reserva not found');
    }

    // Fetch campaign details if accepted (find by reserva_id)
    let campaign = null;
    if (action === 'accepted') {
      const { data: campaignData } = await supabase
        .from('campañas')
        .select('*')
        .eq('reserva_id', reservaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      campaign = campaignData;
    }

    // Send email to advertiser
    await sendEmailToAdvertiser(reserva, campaign, action);

    // Send email to owner
    await sendEmailToOwner(reserva, action);

    console.log("Campaign notification emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-campaign-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendEmailToAdvertiser(reserva: any, campaign: any, action: string): Promise<void> {
  const advertiserEmail = reserva.advertiser?.email;
  if (!advertiserEmail) {
    console.error('Advertiser email not found');
    return;
  }

  const isAccepted = action === 'accepted';
  
  const campaignDetailsHtml = isAccepted && campaign ? `
    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #064e3b; margin-top: 0;">📊 Detalles de la Campaña:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Nombre de Campaña:</td>
          <td style="padding: 8px 0; font-weight: bold;">${campaign.nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Presupuesto Total:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #10b981;">$${campaign.presupuesto_total.toLocaleString()} MXN</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Duración:</td>
          <td style="padding: 8px 0; font-weight: bold;">${campaign.dias_totales} días</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Fecha de Inicio:</td>
          <td style="padding: 8px 0; font-weight: bold;">${new Date(campaign.fecha_inicio).toLocaleDateString('es-MX')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Fecha de Fin:</td>
          <td style="padding: 8px 0; font-weight: bold;">${new Date(campaign.fecha_fin).toLocaleDateString('es-MX')}</td>
        </tr>
      </table>
    </div>
  ` : '';

  const subject = isAccepted 
    ? `✅ ¡Tu Campaña Fue Aceptada! - ${reserva.asset_name}`
    : `❌ Campaña Rechazada - ${reserva.asset_name}`;

  const message = isAccepted
    ? `Tu solicitud de reserva para <strong>${reserva.asset_name}</strong> ha sido aceptada por el propietario. Tu campaña ya está activa y comenzará a correr según las fechas programadas.`
    : `Lamentablemente, tu solicitud de reserva para <strong>${reserva.asset_name}</strong> ha sido rechazada por el propietario. Te recomendamos explorar otras opciones disponibles en nuestra plataforma.`;

  const { error } = await resend.emails.send({
    from: 'Campañas AdAvailable <onboarding@resend.dev>',
    to: [advertiserEmail],
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${isAccepted ? '#10b981 0%, #059669' : '#ef4444 0%, #dc2626'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${isAccepted ? '¡Campaña Aceptada!' : 'Campaña Rechazada'}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${reserva.advertiser?.name || 'Anunciante'},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            ${message}
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📋 Detalles de la Reserva:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Espacio Publicitario:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.asset_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Tipo:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.asset_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Modalidad:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.modalidad}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Precio Total:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2563eb;">$${reserva.precio_total.toLocaleString()} MXN</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Fecha Inicio:</td>
                <td style="padding: 8px 0; font-weight: bold;">${new Date(reserva.fecha_inicio).toLocaleDateString('es-MX')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Fecha Fin:</td>
                <td style="padding: 8px 0; font-weight: bold;">${new Date(reserva.fecha_fin).toLocaleDateString('es-MX')}</td>
              </tr>
            </table>
          </div>

          ${campaignDetailsHtml}
          
          ${isAccepted ? `
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af;">
                <strong>🚀 ¡Tu campaña está activa!</strong><br>
                Puedes monitorear el progreso de tu campaña en tiempo real desde tu panel de control en la sección "Progreso de Campañas".
              </p>
            </div>
          ` : `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e;">
                <strong>💡 Sugerencia:</strong><br>
                Explora otros espacios publicitarios disponibles que puedan adaptarse mejor a tus necesidades. Nuestro equipo está disponible para ayudarte a encontrar la mejor opción.
              </p>
            </div>
          `}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 14px;">
            <p>Equipo de AdAvailable</p>
            <p style="font-size: 12px; margin-top: 10px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
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

  console.log('Email sent successfully to advertiser:', advertiserEmail);
}

async function sendEmailToOwner(reserva: any, action: string): Promise<void> {
  const ownerEmail = reserva.owner?.email;
  if (!ownerEmail) {
    console.error('Owner email not found');
    return;
  }

  const isAccepted = action === 'accepted';

  const { error } = await resend.emails.send({
    from: 'Campañas AdAvailable <onboarding@resend.dev>',
    to: [ownerEmail],
    subject: `✅ Confirmación: ${isAccepted ? 'Aceptaste' : 'Rechazaste'} una Reserva - ${reserva.asset_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${isAccepted ? '#10b981 0%, #059669' : '#f59e0b 0%, #d97706'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reserva ${isAccepted ? 'Aceptada' : 'Rechazada'}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${reserva.owner?.name || 'Propietario'},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Has ${isAccepted ? 'aceptado' : 'rechazado'} la solicitud de reserva para <strong>${reserva.asset_name}</strong>.
            ${isAccepted ? 'El anunciante ha sido notificado y su campaña comenzará según lo programado.' : 'El anunciante ha sido notificado de tu decisión.'}
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📋 Resumen de la Reserva:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Espacio:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.asset_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Anunciante:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.advertiser?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Modalidad:</td>
                <td style="padding: 8px 0; font-weight: bold;">${reserva.modalidad}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Período:</td>
                <td style="padding: 8px 0; font-weight: bold;">
                  ${new Date(reserva.fecha_inicio).toLocaleDateString('es-MX')} - ${new Date(reserva.fecha_fin).toLocaleDateString('es-MX')}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Ingreso:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #10b981;">$${reserva.precio_total.toLocaleString()} MXN</td>
              </tr>
            </table>
          </div>
          
          ${isAccepted ? `
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #064e3b;">
                <strong>💰 Próximos Pasos:</strong><br>
                El pago será procesado y transferido a tu cuenta según los términos acordados. 
                Mantén el espacio publicitario en óptimas condiciones durante el período de la campaña.
              </p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 14px;">
            <p>Equipo de AdAvailable</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  if (error) {
    console.error('Error sending email to owner:', error);
    throw error;
  }

  console.log('Email sent successfully to owner:', ownerEmail);
}

serve(handler);
