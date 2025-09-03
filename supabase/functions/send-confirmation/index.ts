import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Create PDF content
    const pdfContent = createPDFContent(reservations, total);
    
    // Send email with SendGrid
    const emailResponse = await sendEmailWithSendGrid(email, reservations, total, pdfContent);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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

function createPDFContent(reservations: any[], total: number): string {
  // Simple HTML content that will be converted to PDF
  const reservationItems = reservations.map(res => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${res.asset_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">ID: ${res.id.slice(-6)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${res.asset_type}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${res.modalidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${res.fecha_inicio}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${res.fecha_fin}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${res.precio_total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resumen de Reservas</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f5f5f5; padding: 12px; border-bottom: 2px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resumen de Reservas</h1>
        <p>Fecha: ${new Date().toLocaleDateString('es-MX')}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Anuncio</th>
            <th>ID</th>
            <th>Tipo</th>
            <th>Modalidad</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${reservationItems}
        </tbody>
      </table>
      
      <div class="total">
        Total: $${total.toFixed(2)}
      </div>
    </body>
    </html>
  `;
}

async function sendEmailWithSendGrid(email: string, reservations: any[], total: number, pdfContent: string): Promise<any> {
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }

  // Convert HTML to base64 for PDF attachment (simplified approach)
  const pdfBase64 = btoa(unescape(encodeURIComponent(pdfContent)));

  const emailData = {
    personalizations: [
      {
        to: [{ email: email }],
        subject: "Confirmación de Reservas - Resumen de Selección"
      }
    ],
    from: {
      email: "noreply@lovable.app",
      name: "Sistema de Reservas"
    },
    content: [
      {
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">¡Reservas Confirmadas!</h1>
            
            <p>Hola,</p>
            
            <p>Hemos recibido tu solicitud de reserva. A continuación encontrarás el resumen de tu selección:</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Resumen de Reservas:</h3>
              ${reservations.map(res => `
                <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                  <strong>${res.asset_name}</strong> (ID: ${res.id.slice(-6)})<br>
                  Tipo: ${res.asset_type} | Modalidad: ${res.modalidad}<br>
                  Fechas: ${res.fecha_inicio} al ${res.fecha_fin}<br>
                  Precio: $${res.precio_total.toFixed(2)}
                </div>
              `).join('')}
              
              <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 15px; color: #333;">
                Total: $${total.toFixed(2)}
              </div>
            </div>
            
            <p>Tus reservas han sido enviadas a los propietarios correspondientes y están en estado HOLD por 48 horas. Recibirás notificaciones sobre su estado.</p>
            
            <p>Adjunto encontrarás un PDF con el resumen detallado de tu selección.</p>
            
            <p>¡Gracias por confiar en nosotros!</p>
            
            <p>
              Saludos,<br>
              El Equipo de Reservas
            </p>
          </div>
        `
      }
    ],
    attachments: [
      {
        content: pdfBase64,
        filename: "resumen-reservas.pdf",
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
  }

  return { success: true, status: response.status };
}

serve(handler);