import { getEtsyProducts } from "@/lib/etsy-api";
import { createClient } from "@/utils/supabase/server";

import TemplatesManagement from "@/components/magnepixit/templates-management";

export const metadata = {
  title: "MagnePixIt | Templates & Items",
  description: "Manage photo cropping templates and items for your products.",
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  // Get templates
  const { data: templates, error: templatesError } = await supabase
    .from("magnepixit_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // Get items
  const { data: items, error: itemsError } = await supabase
    .from("magnepixit_items")
    .select("*")
    .order("created_at", { ascending: false });

  // Get template-item relationships
  const { data: templateItems, error: templateItemsError } = await supabase
    .from("magnepixit_templates_items")
    .select("*");

  // Get template-product relationships
  const { data: templateProducts, error: templateProductsError } =
    await supabase.from("magnepixit_templates_products").select("*");

  // Get stored products
  const { data: storedProducts, error: storedProductsError } = await supabase
    .from("magnepixit_products")
    .select("*");

  // Get Etsy products
  let etsyProducts: { id: string; title: string }[] = [];
  try {
    etsyProducts = await getEtsyProducts();
  } catch (error) {
    console.error("Error fetching Etsy products:", error);
  }

  if (
    templatesError ||
    itemsError ||
    templateItemsError ||
    templateProductsError ||
    storedProductsError
  ) {
    return (
      <div className="p-6 w-full max-w-6xl">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">Error loading data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <TemplatesManagement
      initialTemplates={templates || []}
      initialItems={items || []}
      initialTemplateItems={templateItems || []}
      initialTemplateProducts={templateProducts || []}
      initialStoredProducts={storedProducts || []}
      etsyProducts={etsyProducts}
    />
  );
}
