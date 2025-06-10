interface RejectionEmailData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  rejectionReason: string;
}

export async function sendRejectionEmail(
  data: RejectionEmailData,
): Promise<void> {
  try {
    const response = await fetch("/api/send-rejection-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to send rejection email");
    }
  } catch (error) {
    console.error("Error sending rejection email:", error);
    throw error;
  }
}
