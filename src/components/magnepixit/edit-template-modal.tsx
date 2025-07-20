"use client";

import { useState, useEffect } from "react";
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

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  templateItems: TemplateItem[];
  templateProducts: TemplateProduct[];
  allItems: Item[];
  allStoredProducts: StoredProduct[];
  etsyProducts: EtsyProduct[];
  onUpdated: (template: Template) => void;
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
  onTemplateProductsChange: (templateProducts: TemplateProduct[]) => void;
  onStoredProductsChange: (storedProducts: StoredProduct[]) => void;
}

export default function EditTemplateModal({
  isOpen,
  onClose,
  template,
  templateItems,
  templateProducts,
  allItems,
  allStoredProducts,
  etsyProducts,
  onUpdated,
  onTemplateItemsChange,
  onTemplateProductsChange,
  onStoredProductsChange,
}: EditTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    { itemId: number; quantity: number }[]
  >([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && template) {
      setTemplateTitle(template.title || "");

      // Load current template items with quantities
      const currentItems = templateItems
        .filter((ti) => ti.template_id === template.id)
        .map((ti) => ({
          itemId: ti.item_id!,
          quantity: ti.item_quantity || 1,
        }));
      setSelectedItems(currentItems);

      // Load current template products
      const currentProductIds = templateProducts
        .filter((tp) => tp.template_id === template.id)
        .map((tp) => {
          const storedProduct = allStoredProducts.find(
            (sp) => sp.id === tp.product_id,
          );
          return storedProduct?.product_id;
        })
        .filter(Boolean) as string[];
      setSelectedProducts(currentProductIds);
    }
  }, [isOpen, template, templateItems, templateProducts, allStoredProducts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim()) return;

    setLoading(true);
    try {
      // Update the template
      const { data: updatedTemplate, error: templateError } = await supabase
        .from("magnepixit_templates")
        .update({
          title: templateTitle,
        })
        .eq("id", template.id)
        .select()
        .single();

      if (templateError) throw templateError;

      // Delete existing template-item relationships
      const { error: deleteItemsError } = await supabase
        .from("magnepixit_templates_items")
        .delete()
        .eq("template_id", template.id);

      if (deleteItemsError) throw deleteItemsError;

      // Add new template-item relationships
      if (selectedItems.length > 0) {
        const templateItemInserts = selectedItems.map((item) => ({
          template_id: template.id,
          item_id: item.itemId,
          item_quantity: item.quantity,
        }));

        const { data: newTemplateItems, error: templateItemsError } =
          await supabase
            .from("magnepixit_templates_items")
            .insert(templateItemInserts)
            .select();

        if (templateItemsError) throw templateItemsError;

        // Update template items state
        if (newTemplateItems) {
          onTemplateItemsChange(newTemplateItems);
        }
      }

      // Delete existing template-product relationships
      const { error: deleteProductsError } = await supabase
        .from("magnepixit_templates_products")
        .delete()
        .eq("template_id", template.id);

      if (deleteProductsError) throw deleteProductsError;

      // Handle products
      if (selectedProducts.length > 0) {
        const newStoredProducts: StoredProduct[] = [];
        const templateProductInserts: {
          template_id: number;
          product_id: number;
        }[] = [];

        for (const etsyProductId of selectedProducts) {
          let storedProduct = allStoredProducts.find(
            (p) => p.product_id === etsyProductId,
          );

          if (!storedProduct) {
            const etsyProduct = etsyProducts.find(
              (p) => p.id === etsyProductId,
            );
            if (etsyProduct) {
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

        if (newStoredProducts.length > 0) {
          onStoredProductsChange([...allStoredProducts, ...newStoredProducts]);
        }

        if (templateProductInserts.length > 0) {
          const { data: newTemplateProducts, error: templateProductsError } =
            await supabase
              .from("magnepixit_templates_products")
              .insert(templateProductInserts)
              .select();

          if (templateProductsError) throw templateProductsError;

          if (newTemplateProducts) {
            onTemplateProductsChange(newTemplateProducts);
          }
        }
      }

      onUpdated(updatedTemplate);
      toast.success("Template updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.itemId === itemId);
      if (existing) {
        return prev.filter((item) => item.itemId !== itemId);
      } else {
        return [...prev, { itemId, quantity: 1 }];
      }
    });
  };

  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) return; // Ensure quantity is greater than 0

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item,
      ),
    );
  };

  const getItemQuantity = (itemId: number) => {
    const item = selectedItems.find((item) => item.itemId === itemId);
    return item?.quantity || 1;
  };

  const isItemSelected = (itemId: number) => {
    return selectedItems.some((item) => item.itemId === itemId);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Get products that don't already have a template assigned (excluding current template)
  const getAvailableProducts = () => {
    const assignedProductIds = new Set(
      templateProducts
        .filter((tp) => tp.template_id !== template.id)
        .map((tp) => {
          const storedProduct = allStoredProducts.find(
            (sp) => sp.id === tp.product_id,
          );
          return storedProduct?.product_id;
        })
        .filter(Boolean),
    );

    return etsyProducts.filter(
      (product) => !assignedProductIds.has(product.id),
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Template</h3>
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
                Items in Template
              </label>
              <div className="max-h-60 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-2">
                {allItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isItemSelected(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-neutral-300 text-[#5B9994] focus:ring-[#5B9994]"
                      />
                      <span className="text-sm">
                        {item.title} ({item.width}×{item.height}
                        {item.dimension_type})
                      </span>
                    </label>

                    {isItemSelected(item.id) && (
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-neutral-600">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={getItemQuantity(item.id)}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value);
                            if (qty > 0) {
                              updateItemQuantity(item.id, qty);
                            }
                          }}
                          className="w-16 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994] focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {etsyProducts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Apply to Etsy Products
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
              {loading ? "Updating..." : "Update Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
