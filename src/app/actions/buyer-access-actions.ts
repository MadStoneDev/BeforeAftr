"use server";

import { createClient } from "@/utils/supabase/server";

type AuthResponse = {
  error: string | null;
  success: boolean;
  orderId: string;
};

export const handleBuyerAccess = async (
  formData: FormData,
): Promise<AuthResponse> => {
  const accessCode = formData.get("accessCode") as string;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("magnepixit_orders")
      .select("id")
      .eq("access_code", accessCode);

    if (!data || data.length === 0 || error) {
      console.error("Could not find order:", error);
      return {
        error: "Could not find order",
        success: false,
        orderId: "",
      };
    }

    return {
      error: null,
      success: true,
      orderId: data[0].id,
    };
  } catch (error: any) {
    console.error("Unexpected error during authentication:", error);
    return {
      error: `Authentication error: ${error?.message || "Unknown error"}`,
      success: false,
      orderId: "",
    };
  }
};
