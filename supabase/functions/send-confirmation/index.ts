import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateEmailHTML(reservationDetails: any, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">¡Reserva Confirmada!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Tu solicitud está en proceso</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hola ${userName},</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Tu reserva ha sido enviada exitosamente a los propietarios correspondientes. 
          Tienes <strong>48 horas de HOLD</strong> mientras recibimos la confirmación.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #333; margin-bottom: 15px;">Resumen de tu reserva:</h3>
          <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${reservationDetails.items?.map((item: any) => 
              `<li><strong>${item.asset.nombre}</strong> - ${item.modalidad} (ID: ${item.asset.id.slice(-6)})</li>`
            ).join('') || ''}
          </ul>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <strong style="color: #333;">Total: ${reservationDetails.total || '$0'}</strong>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1976d2; margin-bottom: 10px;">¿Qué sigue?</h4>
          <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Los propietarios revisarán tu solicitud</li>
            <li>Recibirás notificaciones sobre el estado de cada reserva</li>
            <li>Las reservas aceptadas se convertirán en campañas activas</li>
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-top: 30px;">
          Encuentra el resumen detallado en el archivo PDF adjunto a este correo.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999; font-size: 14px;">
            Gracias por usar nuestra plataforma de publicidad exterior.
          </p>
        </div>
      </div>
    </div>
  `;
}

interface EmailConfirmationRequest {
  reservationDetails: any;
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { reservationDetails, userEmail, userName }: EmailConfirmationRequest = await req.json();

    // Generate PDF content as base64
    const pdfContent = generatePDFContent(reservationDetails);

    console.log("Sending confirmation email via SendGrid to:", userEmail);

    // SendGrid API request
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "no-reply@lovable.app",
          name: "Billboard Platform"
        },
        personalizations: [
          {
            to: [{ email: userEmail, name: userName || "Usuario" }],
            subject: "Confirmación de Reserva - Hold 48h"
          }
        ],
        content: [
          {
            type: "text/html",
            value: generateEmailHTML(reservationDetails, userName || "Usuario")
          }
        ],
        attachments: [
          {
            content: pdfContent,
            filename: `reserva-${Date.now()}.pdf`,
            type: "application/pdf",
            disposition: "attachment"
          }
        ]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`SendGrid API error: ${emailResponse.status} - ${errorText}`);
    }

    console.log("Email sent successfully via SendGrid");

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
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

function generatePDFContent(reservationDetails: any): string {
  // Simple PDF generation - in a real implementation, you'd use a proper PDF library
  // For now, we'll create a basic text-based attachment
  const content = `
CONFIRMACIÓN DE RESERVA
======================

Fecha: ${new Date().toLocaleDateString('es-MX')}
Estado: HOLD 48 horas

DETALLES DE LA RESERVA:
${reservationDetails.items?.map((item: any, index: number) => `
${index + 1}. ${item.asset.nombre}
   - Tipo: ${item.asset.tipo}
   - Modalidad: ${item.modalidad}
   - ID: ${item.asset.id.slice(-6)}
   - Cantidad: ${item.quantity}
   - Subtotal: ${item.subtotal}
`).join('') || ''}

TOTAL: ${reservationDetails.total || '$0'}

INSTRUCCIONES:
- Tu reserva está en estado HOLD por 48 horas
- Los propietarios revisarán tu solicitud
- Recibirás notificaciones sobre el estado
- Las reservas aceptadas se convertirán en campañas

¡Gracias por usar nuestra plataforma!
  `;

  // Convert to base64 (simplified approach)
  return btoa(unescape(encodeURIComponent(content)));
}

serve(handler);