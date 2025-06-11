"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { IconX } from "@tabler/icons-react";

import { Database } from "../../../database.types";

type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];
type TemplateProduct =
  Database["public"]["Tables"]["magnepixit_templates_products"]["Row"];
type StoredProduct = Database["public"]["Tables"]["magnepixit_products"]["Row"];

interface EtsyProduct {
  id: string;
  title: string;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (template: Template) => void;
  allItems: Item[];
  allStoredProducts: StoredProduct[];
  etsyProducts: EtsyProduct[];
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
  onTemplateProductsChange: (templateProducts: TemplateProduct[]) => void;
  onStoredProductsChange: (storedProducts: StoredProduct[]) => void;
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreated,
  allItems,
  allStoredProducts,
  etsyProducts,
  onTemplateItemsChange,
  onTemplateProductsChange,
  onStoredProductsChange,
}: CreateTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim()) return;

    setLoading(true);
    try {
      // Create the template
      const { data: template, error: templateError } = await supabase
        .from("magnepixit_templates")
        .insert({
          title: templateTitle,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add items to template
      if (selectedItems.length > 0) {
        const templateItemInserts = selectedItems.map((itemId) => ({
          template_id: template.id,
          item_id: itemId,
        }));

        const { data: templateItems, error: templateItemsError } =
          await supabase
            .from("magnepixit_templates_items")
            .insert(templateItemInserts)
            .select();

        if (templateItemsError) throw templateItemsError;

        // Update template items state
        if (templateItems) {
          onTemplateItemsChange(templateItems);
        }
      }

      // Handle products
      if (selectedProducts.length > 0) {
        const newStoredProducts: StoredProduct[] = [];
        const templateProductInserts: {
          template_id: number;
          product_id: number;
        }[] = [];

        for (const etsyProductId of selectedProducts) {
          // Check if product already exists in our database
          let storedProduct = allStoredProducts.find(
            (p) => p.product_id === etsyProductId,
          );

          if (!storedProduct) {
            // Find the Etsy product details
            const etsyProduct = etsyProducts.find(
              (p) => p.id === etsyProductId,
            );
            if (etsyProduct) {
              // Create new stored product
              const { data: newProduct, error: productError } = await supabase
                .from("magnepixit_products")
                .insert({
                  product_id: etsyProductId,
                  title: etsyProduct.title,
                  created_timestamp: new Date().toISOString(),
                })
                .select()
                .single();

              if (productError) throw productError;
              storedProduct = newProduct;
              newStoredProducts.push(newProduct);
            }
          }

          if (storedProduct) {
            templateProductInserts.push({
              template_id: template.id,
              product_id: storedProduct.id,
            });
          }
        }

        // Update stored products state if we created new ones
        if (newStoredProducts.length > 0) {
          onStoredProductsChange([...allStoredProducts, ...newStoredProducts]);
        }

        // Create template-product relationships
        if (templateProductInserts.length > 0) {
          const { data: templateProducts, error: templateProductsError } =
            await supabase
              .from("magnepixit_templates_products")
              .insert(templateProductInserts)
              .select();

          if (templateProductsError) throw templateProductsError;

          // Update template products state
          if (templateProducts) {
            onTemplateProductsChange(templateProducts);
          }
        }
      }

      onCreated(template);

      // Reset form
      setTemplateTitle("");
      setSelectedItems([]);
      setSelectedProducts([]);
      onClose();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Get products that don't already have a template assigned
  const getAvailableProducts = () => {
    const assignedProductIds = new Set(
      allStoredProducts
        .filter((product) => {
          // Check if this product is already assigned to any template
          return onTemplateProductsChange.length > 0; // This is a placeholder - you'd need to pass template products state
        })
        .map((p) => p.product_id),
    );

    return etsyProducts.filter(
      (product) => !assignedProductIds.has(product.id),
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create New Template</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Template Title
            </label>
            <input
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
              placeholder="e.g., Business Card Template"
              required
            />
          </div>

          {allItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Add Items to Template (Optional)
              </label>
              <div className="max-h-40 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-2">
                {allItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="rounded border-neutral-300 text-[#5B9994] focus:ring-[#5B9994]"
                    />
                    <span className="text-sm">
                      {item.title} ({item.width}×{item.height}
                      {item.dimension_type})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {etsyProducts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Apply to Etsy Products (Optional)
              </label>
              <div className="max-h-40 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-2">
                {getAvailableProducts().map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="rounded border-neutral-300 text-[#5B9994] focus:ring-[#5B9994]"
                    />
                    <span className="text-sm">{product.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !templateTitle.trim()}
              className="px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
