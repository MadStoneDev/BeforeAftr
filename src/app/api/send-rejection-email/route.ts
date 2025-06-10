import { NextRequest, NextResponse } from "next/server";

interface RejectionEmailRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  rejectionReason: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RejectionEmailRequest = await request.json();
    const { customerEmail, customerName, orderNumber, rejectionReason } = body;

    // MailerSend API configuration
    const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN;
    const TEMPLATE_ID = process.env.MAILERSEND_REJECTION_TEMPLATE_ID;

    if (!MAILERSEND_API_TOKEN || !TEMPLATE_ID) {
      throw new Error("MailerSend configuration missing");
    }

    const emailData = {
      template_id: TEMPLATE_ID,
      from: {
        email: "noreply@magnepixit.com", // Replace with your verified domain
        name: "MagnePixIt",
      },
      to: [
        {
          email: customerEmail,
          name: customerName,
        },
      ],
      variables: [
        {
          email: customerEmail,
          substitutions: [
            {
              var: "customer_name",
              value: customerName,
            },
            {
              var: "order_number",
              value: orderNumber,
            },
            {
              var: "rejection_reason",
              value: rejectionReason,
            },
          ],
        },
      ],
    };

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MAILERSEND_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MailerSend API error:", errorData);
      throw new Error(`MailerSend API error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending rejection email:", error);
    return NextResponse.json(
      { error: "Failed to send rejection email" },
      { status: 500 },
    );
  }
}
