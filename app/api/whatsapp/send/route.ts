// app/api/whatsapp/send/route.ts — WhatsApp Business API integration
import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Business API configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

interface WhatsAppMessage {
  to: string;
  message: string;
  notificationId: string;
}

// Send WhatsApp message via Business API
export async function POST(request: NextRequest) {
  try {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.warn('WhatsApp credentials not configured, using demo mode');
      return NextResponse.json({ 
        success: true, 
        demo: true,
        message: 'Demo mode: WhatsApp notification would be sent' 
      });
    }

    const { to, message, notificationId }: WhatsAppMessage = await request.json();

    // Validate Nigerian phone number
    const phoneRegex = /^\+234[7-9][0-1]\d{8}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid Nigerian phone number format. Use +234XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Format phone number for WhatsApp API (remove + and country code)
    const formattedPhone = to.replace('+', '');

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json();
      console.error('WhatsApp API error:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Failed to send WhatsApp message',
          details: errorData.error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    const result = await whatsappResponse.json();
    
    // Log successful delivery
    console.log(`WhatsApp notification sent to ${to}:`, {
      messageId: result.messages?.[0]?.id,
      notificationId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      notificationId
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WhatsApp webhook verified successfully');
      return new Response(challenge, { status: 200 });
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log('WhatsApp webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  return new Response('Bad Request', { status: 400 });
}

// Handle incoming WhatsApp messages (webhook) - this would be a separate route
// export async function POST_WEBHOOK(request: NextRequest) {
//   try {
//     const body = await request.json();
//     
//     // Process incoming WhatsApp messages
//     if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
//       const message = body.entry[0].changes[0].value.messages[0];
//       const from = message.from;
//       const messageBody = message.text?.body?.toLowerCase();
//
//       // Handle common responses
//       if (messageBody === 'stop' || messageBody === 'unsubscribe') {
//         // Unsubscribe user from WhatsApp notifications
//         await handleUnsubscribe(from);
//       } else if (messageBody === 'help') {
//         // Send help message
//         await sendHelpMessage(from);
//       } else if (messageBody === 'status') {
//         // Send medication status
//         await sendMedicationStatus(from);
//       }
//     }
//
//     return NextResponse.json({ status: 'ok' });
//   } catch (error) {
//     console.error('WhatsApp webhook error:', error);
//     return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
//   }
// }

// Handle user unsubscribe
async function handleUnsubscribe(phoneNumber: string) {
  try {
    // Store unsubscribe preference in database or localStorage
    // For demo purposes, we'll just log it
    console.log(`User ${phoneNumber} unsubscribed from WhatsApp notifications`);
    
    // Send confirmation message
    await sendWhatsAppMessage(
      phoneNumber,
      "You have been unsubscribed from Olive AI medication reminders. Reply START to re-subscribe. Stay healthy! 💚"
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
  }
}

// Send help message
async function sendHelpMessage(phoneNumber: string) {
  const helpMessage = `
*Olive AI - Help* 💊

Commands you can use:
• *STOP* - Unsubscribe from reminders
• *START* - Re-subscribe to reminders  
• *STATUS* - Check your medication status
• *HELP* - Show this help message

For emergencies, call 199 or visit your nearest hospital.

Visit our app for complete medication management: https://olive-ai.vercel.app
  `.trim();

  await sendWhatsAppMessage(phoneNumber, helpMessage);
}

// Send medication status
async function sendMedicationStatus(phoneNumber: string) {
  // In a real app, this would query the user's medication data
  const statusMessage = `
*Your Medication Status* 📋

Today's medications:
✅ Morning dose taken
⏰ Afternoon dose - 2:00 PM
⏰ Evening dose - 8:00 PM

Keep up the good work! 💪

Reply HELP for more options.
  `.trim();

  await sendWhatsAppMessage(phoneNumber, statusMessage);
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log(`Demo WhatsApp to ${to}: ${message}`);
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'text',
          text: { body: message }
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  } catch (error) {
    console.error('WhatsApp send error:', error);
  }
}