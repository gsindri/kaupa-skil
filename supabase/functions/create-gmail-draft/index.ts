import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderEmailData {
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  organizationName: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    packSize: string;
    unitPrice: number | null;
  }>;
  subtotal: number;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  language: 'en' | 'is';
}

function generateHtmlEmail(data: OrderEmailData): string {
  const isIcelandic = data.language === 'is';
  
  const greeting = isIcelandic ? 'Góðan daginn,' : 'Hello,';
  const intro = isIcelandic 
    ? 'Við viljum leggja inn eftirfarandi pöntun:' 
    : 'We would like to place the following order:';
  const poLabel = isIcelandic ? 'Pöntunarnúmer' : 'PO Number';
  const companyLabel = isIcelandic ? 'Fyrirtæki' : 'Company';
  const deliveryLabel = isIcelandic ? 'Óskuð afhendingardagsetning' : 'Requested Delivery Date';
  const addressLabel = isIcelandic ? 'Afhendingarstaður' : 'Delivery Address';
  const itemsLabel = isIcelandic ? 'Vörur' : 'Items';
  const qtyLabel = isIcelandic ? 'Magn' : 'Quantity';
  const priceLabel = isIcelandic ? 'Verð' : 'Price';
  const subtotalLabel = isIcelandic ? 'Samtals (án VSK)' : 'Subtotal (excl. VAT)';
  const notesLabel = isIcelandic ? 'Athugasemdir' : 'Notes';
  const contactLabel = isIcelandic ? 'Tengiliðaupplýsingar' : 'Contact Information';
  const nameLabel = isIcelandic ? 'Nafn' : 'Name';
  const emailLabel = isIcelandic ? 'Netfang' : 'Email';
  const phoneLabel = isIcelandic ? 'Sími' : 'Phone';
  const confirmLabel = isIcelandic 
    ? 'Vinsamlegast staðfestið móttöku pöntunar.' 
    : 'Please confirm receipt of this order.';
  const regardsLabel = isIcelandic ? 'Með bestu kveðjum' : 'Best regards';
  const noPriceLabel = isIcelandic ? 'Verð ekki til' : 'Price not available';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .subtotal { font-size: 1.2em; font-weight: bold; margin: 20px 0; }
    .contact-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; color: #666; }
  </style>
</head>
<body>
  <p>${greeting}</p>
  <p>${intro}</p>
  
  <div class="header">
    <div class="info-row"><span class="label">${poLabel}:</span> ${data.poNumber}</div>
    <div class="info-row"><span class="label">${companyLabel}:</span> ${data.organizationName}</div>
    ${data.deliveryDate ? `<div class="info-row"><span class="label">${deliveryLabel}:</span> ${data.deliveryDate}</div>` : ''}
    ${data.deliveryAddress ? `<div class="info-row"><span class="label">${addressLabel}:</span> ${data.deliveryAddress}</div>` : ''}
  </div>

  <h2>${itemsLabel}</h2>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>${isIcelandic ? 'Vara' : 'Item'}</th>
        <th>${qtyLabel}</th>
        <th>${priceLabel}</th>
      </tr>
    </thead>
    <tbody>
`;

  data.items.forEach(item => {
    const price = item.unitPrice 
      ? `${item.unitPrice.toLocaleString(isIcelandic ? 'is-IS' : 'en-US')} kr.`
      : noPriceLabel;
    
    html += `
      <tr>
        <td>${item.sku}</td>
        <td>${item.name}</td>
        <td>${item.quantity} ${item.packSize}</td>
        <td>${price}</td>
      </tr>
    `;
  });

  html += `
    </tbody>
  </table>

  <div class="subtotal">
    ${subtotalLabel}: ${data.subtotal.toLocaleString(isIcelandic ? 'is-IS' : 'en-US')} kr.
  </div>
`;

  if (data.notes) {
    html += `
  <div>
    <h3>${notesLabel}</h3>
    <p>${data.notes}</p>
  </div>
`;
  }

  html += `
  <div class="contact-info">
    <h3>${contactLabel}</h3>
    ${data.contactName ? `<div><span class="label">${nameLabel}:</span> ${data.contactName}</div>` : ''}
    ${data.contactEmail ? `<div><span class="label">${emailLabel}:</span> ${data.contactEmail}</div>` : ''}
    ${data.contactPhone ? `<div><span class="label">${phoneLabel}:</span> ${data.contactPhone}</div>` : ''}
  </div>

  <div class="footer">
    <p>${confirmLabel}</p>
    <p>${regardsLabel},<br>${data.organizationName}</p>
  </div>
</body>
</html>
`;

  return html;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Create client with user's token to get user ID
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get order data from request
    const orderData: OrderEmailData = await req.json();

    // Get user's Gmail tokens using service role
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expires_at, gmail_authorized')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.gmail_authorized) {
      return new Response(JSON.stringify({ error: 'Gmail not authorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = profile.gmail_access_token;

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(profile.gmail_token_expires_at);
    if (expiresAt < new Date()) {
      const newToken = await refreshAccessToken(profile.gmail_refresh_token);
      if (!newToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token. Please re-authorize Gmail.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      accessToken = newToken;
      
      // Update token in database
      await supabaseAdmin
        .from('profiles')
        .update({
          gmail_access_token: newToken,
          gmail_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        })
        .eq('id', user.id);
    }

    // Generate HTML email
    const htmlBody = generateHtmlEmail(orderData);
    const subject = orderData.language === 'is'
      ? `Pöntun ${orderData.poNumber} frá ${orderData.organizationName}`
      : `Order ${orderData.poNumber} from ${orderData.organizationName}`;

    // Create email message in base64
    const message = [
      `To: ${orderData.supplierEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
    ].join('\n');

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Create draft in Gmail
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          raw: encodedMessage,
        },
      }),
    });

    if (!gmailResponse.ok) {
      const error = await gmailResponse.text();
      console.error('Gmail API error:', error);
      throw new Error('Failed to create Gmail draft');
    }

    const draftData = await gmailResponse.json();

    return new Response(JSON.stringify({
      success: true,
      draftId: draftData.id,
      draftUrl: `https://mail.google.com/mail/u/0/#drafts?compose=${draftData.message.id}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create Gmail draft error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
