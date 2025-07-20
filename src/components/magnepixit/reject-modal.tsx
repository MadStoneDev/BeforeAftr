"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { IconX } from "@tabler/icons-react";
import { sendRejectionEmail } from "@/lib/email";

import { Database } from "../../../database.types";

type Order = Database["public"]["Tables"]["magnepixit_orders"]["Row"];

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onReject: (reason: string) => void;
}

export default function RejectModal({
  isOpen,
  onClose,
  order,
  onReject,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from("magnepixit_orders")
        .update({
          status: "RI",
          updated_on: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Send rejection email
      if (order.customer_email && order.customer_name && order.order_no) {
        await sendRejectionEmail({
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_no,
          rejectionReason: reason,
        });
      }

      onReject(reason);
      setReason("");
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reject Order</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <p className="text-neutral-600 mb-4">
          Rejecting order <strong>{order.order_no}</strong> for{" "}
          {order.customer_name}. Please provide a reason that will be sent to
          the customer.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            className="w-full p-3 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
            rows={4}
            required
          />

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Rejecting..." : "Reject Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
