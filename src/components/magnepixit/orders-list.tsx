"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { IconLoader2, IconRefresh, IconInbox } from "@tabler/icons-react";

import OrderItem from "@/components/magnepixit/order-item";

import { Database } from "../../../database.types";

type Order = Database["public"]["Tables"]["magnepixit_orders"]["Row"];

interface OrdersListProps {
  initialOrders: Order[];
}

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: refreshedOrders, error } = await supabase
        .from("magnepixit_orders")
        .select("*")
        .order("order_date", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (refreshedOrders) {
        setOrders(refreshedOrders);
        setHasMore(refreshedOrders.length === 20);
      }
    } catch (error) {
      console.error("Error refreshing orders:", error);
    } finally {
      setRefreshing(false);
    }
  }, [supabase]);

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

  // Get status counts for display
  const statusCounts = orders.reduce(
    (acc, order) => {
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden`}>
      <div
        className={`p-6 border-b border-neutral-200 flex items-center justify-between`}
      >
        <div className={`flex items-center gap-4`}>
          <h2 className={`text-xl font-semibold text-neutral-900`}>
            Orders ({orders.length})
          </h2>
        </div>

        <button
          onClick={refreshOrders}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh orders"
        >
          <IconRefresh size={20} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-neutral-100 rounded-full">
              <IconInbox size={48} className="text-neutral-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No orders found
              </h3>
              <p className="text-neutral-500 mb-4">
                No orders have been synced yet. Orders will appear here once
                they're imported from Etsy.
              </p>
              <button
                onClick={refreshOrders}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IconRefresh
                  size={20}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Checking for orders..." : "Check for orders"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-neutral-200">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <IconLoader2 size={20} className="animate-spin" />}
                <span>{loading ? "Loading..." : "Load More Orders"}</span>
              </button>
            </div>
          )}

          {!hasMore && orders.length > 0 && (
            <div className="p-6 border-t border-neutral-200 text-center">
              <p className="text-sm text-neutral-500">
                You've reached the end of your orders
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
