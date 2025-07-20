import { createClient } from "@/utils/supabase/server";
import { generateAccessCode } from "@/lib/utils";
import { syncEtsyOrders, validateEtsyToken } from "@/lib/etsy-api";

import OrdersList from "@/components/magnepixit/orders-list";
import { dummyOrders } from "@/data/dummy-data";

export const metadata = {
  title: "MagnePixIt | Dashboard",
  description: "Merchant dashboard for managing orders and photos.",
};
export default async function MagnePixItDashboardPage() {
  const supabase = await createClient();

  // Check Etsy token validity and sync orders
  try {
    const { data: profile } = await supabase
      .from("magnepixit_profiles")
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
      .from("magnepixit_orders")
      .select("id, order_no")
      .is("access_code", null);

    if (ordersWithoutCodes && ordersWithoutCodes.length > 0) {
      for (const order of ordersWithoutCodes) {
        const accessCode = generateAccessCode();
        await supabase
          .from("magnepixit_orders")
          .update({ access_code: accessCode })
          .eq("id", order.id);
      }
    }
  } catch (error) {
    console.error("Error generating access codes:", error);
  }

  // Get initial orders (first 20)
  const { data: initialOrders, error } = await supabase
    .from("magnepixit_orders")
    .select("*")
    .order("order_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <div className="p-6 w-full max-w-6xl">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="mt-2 text-sm text-red-700">
                There was a problem loading your orders. Please try refreshing
                the page or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-100 sm:rounded-xl overflow-hidden`}
    >
      <div className={`w-full max-w-6xl`}>
        <OrdersList initialOrders={dummyOrders || []} />
        {/*<OrdersList initialOrders={initialOrders || []} />*/}
      </div>
    </main>
  );
}
