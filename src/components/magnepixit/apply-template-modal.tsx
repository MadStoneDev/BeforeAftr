"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { IconX } from "@tabler/icons-react";

interface PhotoConfig {
  title: string;
  productName: string;
  width: number;
  height: number;
}

interface Template {
  id: string;
  created_at: string;
  updated_on: string;
  product_name: string;
  product_id: string;
  template: PhotoConfig[];
}

interface EtsyProduct {
  id: string;
  title: string;
}

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  etsyProducts: EtsyProduct[];
  onApplied: (template: Template) => void;
}

export default function ApplyTemplateModal({
  isOpen,
  onClose,
  template,
  etsyProducts,
  onApplied,
}: ApplyTemplateModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleApply = async () => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      // Create new templates for each selected product
      const templatesToCreate = selectedProducts.map((productId) => {
        const product = etsyProducts.find((p) => p.id === productId);
        return {
          product_name: `${template.product_name} - ${product?.title}`,
          product_id: productId,
          template: template.template,
        };
      });

      const { error } = await supabase
        .from("magnepixit_templates")
        .insert(templatesToCreate);

      if (error) throw error;

      // Update the original template if it wasn't applied to any product
      if (!template.product_id && selectedProducts.length > 0) {
        const firstProduct = etsyProducts.find(
          (p) => p.id === selectedProducts[0],
        );
        const { data: updatedTemplate, error: updateError } = await supabase
          .from("magnepixit_templates")
          .update({
            product_id: selectedProducts[0],
            product_name: `${template.product_name} - ${firstProduct?.title}`,
            updated_on: new Date().toISOString(),
          })
          .eq("id", template.id)
          .select()
          .single();

        if (updateError) throw updateError;
        onApplied(updatedTemplate);
      }

      setSelectedProducts([]);
      onClose();
    } catch (error) {
      console.error("Error applying template:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Apply Template to Products</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-neutral-600 mb-4">
            Select Etsy products to apply the template "{template.product_name}"
            to:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {etsyProducts.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleProductToggle(product.id)}
                  className="w-4 h-4 text-[#5B9994] focus:ring-[#5B9994] border-neutral-300 rounded"
                />
                <span className="text-sm">{product.title}</span>
              </label>
            ))}
          </div>

          {etsyProducts.length === 0 && (
            <p className="text-neutral-500 text-center py-4">
              No Etsy products available. Make sure your Etsy integration is set
              up.
            </p>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || selectedProducts.length === 0}
            className="px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Applying..."
              : `Apply to ${selectedProducts.length} Product${
                  selectedProducts.length !== 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
