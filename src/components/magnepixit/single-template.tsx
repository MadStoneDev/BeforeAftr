"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import {
  IconEdit,
  IconCopy,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

import EditTemplateModal from "@/components/magnepixit/edit-template-modal";
import { Database } from "../../../database.types";

type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type StoredProduct = Database["public"]["Tables"]["magnepixit_products"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];
type TemplateProduct =
  Database["public"]["Tables"]["magnepixit_templates_products"]["Row"];

interface EtsyProduct {
  id: string;
  title: string;
}

interface SingleTemplateProps {
  template: Template;
  items: Item[];
  products: StoredProduct[];
  templateItems: TemplateItem[];
  allItems: Item[];
  allStoredProducts: StoredProduct[];
  etsyProducts: EtsyProduct[];
  onUpdate: (template: Template) => void;
  onDelete: (templateId: number) => void;
  onDuplicate: (template: Template) => void;
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
  onTemplateProductsChange: (templateProducts: TemplateProduct[]) => void;
  onStoredProductsChange: (storedProducts: StoredProduct[]) => void;
}

export default function SingleTemplate({
  template,
  items,
  products,
  templateItems,
  allItems,
  allStoredProducts,
  etsyProducts,
  onUpdate,
  onDelete,
  onDuplicate,
  onTemplateItemsChange,
  onTemplateProductsChange,
  onStoredProductsChange,
}: SingleTemplateProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const supabase = createClient();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${template.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Delete template-item relationships first
      const { error: templateItemsError } = await supabase
        .from("magnepixit_templates_items")
        .delete()
        .eq("template_id", template.id);

      if (templateItemsError) throw templateItemsError;

      // Delete template-product relationships
      const { error: templateProductsError } = await supabase
        .from("magnepixit_templates_products")
        .delete()
        .eq("template_id", template.id);

      if (templateProductsError) throw templateProductsError;

      // Delete the template
      const { error: templateError } = await supabase
        .from("magnepixit_templates")
        .delete()
        .eq("id", template.id);

      if (templateError) throw templateError;

      onDelete(template.id);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group hover:bg-neutral-100 transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mb-2">
              <h3 className="font-semibold text-lg">{template.title}</h3>
              {items.length > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              )}
              {products.length > 0 && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="text-sm text-neutral-600">
              <p>
                Created: {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
              title="Edit template"
              disabled={loading}
            >
              <IconEdit size={20} />
            </button>

            <button
              onClick={() => onDuplicate(template)}
              className="p-2 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
              title="Duplicate template"
              disabled={loading}
            >
              <IconCopy size={20} />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              title="Delete template"
              disabled={loading}
            >
              <IconTrash size={20} />
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
              title={expanded ? "Hide details" : "Show details"}
            >
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
            {items.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-neutral-700 mb-2">
                  Items in this template:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((item) => {
                    const templateItem = templateItems.find(
                      (ti) =>
                        ti.template_id === template.id &&
                        ti.item_id === item.id,
                    );
                    const quantity = templateItem?.item_quantity || 1;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-neutral-50 rounded-lg"
                      >
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-neutral-600">
                          {item.width}×{item.height}
                          {item.dimension_type}
                          {quantity > 1 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Qty: {quantity}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-neutral-700 mb-2">
                  Applied to products:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 bg-green-50 rounded-lg"
                    >
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-neutral-600">
                        Product ID: {product.product_id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && products.length === 0 && (
              <div className="text-center py-4 text-neutral-500 text-sm">
                This template has no items or products assigned yet.
              </div>
            )}
          </div>
        )}
      </div>

      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        template={template}
        templateItems={templateItems}
        templateProducts={[]} // You'll need to pass the actual template products here
        allItems={allItems}
        allStoredProducts={allStoredProducts}
        etsyProducts={etsyProducts}
        onUpdated={onUpdate}
        onTemplateItemsChange={onTemplateItemsChange}
        onTemplateProductsChange={onTemplateProductsChange}
        onStoredProductsChange={onStoredProductsChange}
      />
    </div>
  );
}
