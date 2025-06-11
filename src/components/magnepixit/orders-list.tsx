"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

import { Loader2 } from "lucide-react";
import OrderItem from "@/components/magnepixit/order-item";

interface Order {
  id: string;
  created_at: string;
  updated_on: string;
  order_no: string;
  customer_name: string;
  status: string;
  access_code: string;
  access_history: string | null;
  purge_on: string | null;
  customer_email: string;
  order_date: string;
}

interface OrdersListProps {
  initialOrders: Order[];
}

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialOrders.length === 20);

  const supabase = createClient();

  const loadMoreOrders = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const { data: newOrders, error } = await supabase
        .from("magnepixit_orders")
        .select("*")
        .order("order_date", { ascending: false })
        .range(orders.length, orders.length + 19);

      if (error) throw error;

      if (newOrders && newOrders.length > 0) {
        setOrders((prev) => [...prev, ...newOrders]);
        setHasMore(newOrders.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more orders:", error);
    } finally {
      setLoading(false);
    }
  }, [orders.length, loading, supabase]);

  const updateOrderStatus = useCallback(
    (orderId: string, newStatus: string) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_on: new Date().toISOString(),
              }
            : order,
        ),
      );
    },
    [],
  );

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-neutral-500">
          No orders found. If you think this is an error, please contact
          support.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Orders ({orders.length})
        </h2>
      </div>

      <div className="divide-y divide-neutral-400">
        {orders.map((order) => (
          <OrderItem
            key={order.id}
            order={order}
            onStatusUpdate={updateOrderStatus}
          />
        ))}
      </div>

      {hasMore && (
        <div className="p-6 border-t border-neutral-200 text-center">
          <button
            onClick={loadMoreOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Loading..." : "Load More Orders"}
          </button>
        </div>
      )}

      {!hasMore && orders.length > 0 && (
        <div className="p-6 text-center">
          <p className="text-sm italic text-neutral-400">-- End of orders --</p>
        </div>
      )}
    </div>
  );
}
