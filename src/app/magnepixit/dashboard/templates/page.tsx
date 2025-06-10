import { createClient } from "@/utils/supabase/server";

import { getEtsyProducts } from "@/lib/etsy-api";
import TemplatesList from "@/components/magnepixit/templates-list";

export const metadata = {
  title: "MagnePixIt | Templates",
  description: "Manage photo cropping templates for your products.",
};

interface Template {
  id: string;
  created_at: string;
  updated_on: string;
  product_name: string;
  product_id: string;
  template: PhotoConfig[];
}

interface PhotoConfig {
  title: string;
  productName: string;
  width: number;
  height: number;
}

export default async function TemplatesPage() {
  const supabase = await createClient();

  // Get templates
  const { data: templates, error: templatesError } = await supabase
    .from("templates")
    .select("*")
    .order("updated_on", { ascending: false });

  // Get Etsy products
  let etsyProducts: { id: string; title: string }[] = [];
  try {
    etsyProducts = await getEtsyProducts();
  } catch (error) {
    console.error("Error fetching Etsy products:", error);
  }

  if (templatesError) {
    console.error("Error fetching templates:", templatesError);
    return (
      <main className="flex justify-center min-h-screen w-full text-neutral-900 bg-neutral-100">
        <div className="p-6 w-full max-w-6xl">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">
              Error loading templates. Please try again.
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Template Management
              </h1>
              <p className="text-neutral-600">
                Create and manage photo cropping templates for your Etsy
                products
              </p>
            </div>
            <a
              href="/magnepixit/dashboard"
              className="px-4 py-2 text-[#5B9994] border border-[#5B9994] rounded-lg hover:bg-[#5B9994] hover:text-white transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        <TemplatesList
          initialTemplates={templates || []}
          etsyProducts={etsyProducts}
        />
      </div>
    </main>
  );
}
