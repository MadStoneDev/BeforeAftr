import { createClient } from "@/utils/supabase/server";

import { generateAccessCode } from "@/lib/utils";
import { syncEtsyOrders, validateEtsyToken } from "@/lib/etsy-api";

import { dummyOrders } from "@/data/dummy-data";
import OrdersList from "@/components/magnepixit/orders-list";

export const metadata = {
  title: "MagnePixIt | Dashboard",
  description: "Merchant dashboard for managing orders and photos.",
};

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

export default async function MagnePixItDashboardPage() {
  const supabase = await createClient();

  // Check Etsy token validity and sync orders
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .single();

    if (profile) {
      const isTokenValid = await validateEtsyToken(profile);
      if (isTokenValid) {
        await syncEtsyOrders(supabase, profile);
      } else {
        // Redirect to Etsy auth or show warning
        console.log("Etsy token expired, need to re-authenticate");
      }
    }
  } catch (error) {
    console.error("Error syncing Etsy orders:", error);
  }

  // Generate access codes for orders that don't have them
  try {
    const { data: ordersWithoutCodes } = await supabase
      .from("orders")
      .select("id, order_no")
      .is("access_code", null);

    if (ordersWithoutCodes && ordersWithoutCodes.length > 0) {
      for (const order of ordersWithoutCodes) {
        const accessCode = generateAccessCode();
        await supabase
          .from("orders")
          .update({ access_code: accessCode })
          .eq("id", order.id);
      }
    }
  } catch (error) {
    console.error("Error generating access codes:", error);
  }

  // Get initial orders (first 20)
  const { data: initialOrders, error } = await supabase
    .from("orders")
    .select("*")
    .order("order_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <main className="flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-100">
        <div className="p-6 w-full max-w-6xl">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">
              Error loading dashboard. Please try again.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-100">
      <div className="p-6 w-full max-w-6xl space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Merchant Dashboard
          </h1>
          <p className="text-neutral-600">
            Manage your customer orders and photo uploads
          </p>
        </div>

        <OrdersList initialOrders={dummyOrders || []} />
        {/*<OrdersList initialOrders={initialOrders || []} />*/}
      </div>
    </main>
  );
}
