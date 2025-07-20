"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { IconX } from "@tabler/icons-react";

import { Database } from "../../../database.types";

type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  allTemplates: Template[];
  templateItems: TemplateItem[];
  onUpdated: (item: Item) => void;
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
}

export default function EditItemModal({
  isOpen,
  onClose,
  item,
  allTemplates,
  templateItems,
  onUpdated,
  onTemplateItemsChange,
}: EditItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemWidth, setItemWidth] = useState(85);
  const [itemHeight, setItemHeight] = useState(55);
  const [selectedTemplates, setSelectedTemplates] = useState<
    { templateId: number; quantity: number }[]
  >([]);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && item) {
      setItemTitle(item.title || "");
      setItemWidth(item.width || 85);
      setItemHeight(item.height || 55);

      // Load current template assignments with quantities
      const currentTemplates = templateItems
        .filter((ti) => ti.item_id === item.id)
        .map((ti) => ({
          templateId: ti.template_id!,
          quantity: ti.item_quantity || 1,
        }));
      setSelectedTemplates(currentTemplates);
    }
  }, [isOpen, item, templateItems]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    setLoading(true);
    try {
      // Update the item
      const { data: updatedItem, error: itemError } = await supabase
        .from("magnepixit_items")
        .update({
          title: itemTitle,
          width: itemWidth,
          height: itemHeight,
          dimension_type: "mm",
        })
        .eq("id", item.id)
        .select()
        .single();

      if (itemError) throw itemError;

      // Delete existing template-item relationships for this item
      const { error: deleteError } = await supabase
        .from("magnepixit_templates_items")
        .delete()
        .eq("item_id", item.id);

      if (deleteError) throw deleteError;

      // Add new template-item relationships
      if (selectedTemplates.length > 0) {
        const templateItemInserts = selectedTemplates.map((template) => ({
          template_id: template.templateId,
          item_id: item.id,
          item_quantity: template.quantity,
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

      onUpdated(updatedItem);
      toast.success("Item updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (templateId: number) => {
    setSelectedTemplates((prev) => {
      const existing = prev.find(
        (template) => template.templateId === templateId,
      );
      if (existing) {
        return prev.filter((template) => template.templateId !== templateId);
      } else {
        return [...prev, { templateId, quantity: 1 }];
      }
    });
  };

  const updateTemplateQuantity = (templateId: number, quantity: number) => {
    if (quantity < 1) {
      setSelectedTemplates((prev) =>
        prev.filter((template) => template.templateId !== templateId),
      );
    } else {
      setSelectedTemplates((prev) =>
        prev.map((template) =>
          template.templateId === templateId
            ? { ...template, quantity }
            : template,
        ),
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Item</h3>
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
              Item Title
            </label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
              placeholder="e.g., Standard Square Magnet"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Width (mm)
              </label>
              <input
                type="number"
                value={itemWidth}
                onChange={(e) => setItemWidth(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Height (mm)
              </label>
              <input
                type="number"
                value={itemHeight}
                onChange={(e) => setItemHeight(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>

          {allTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Add to Templates
              </label>
              <div className="max-h-60 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-3">
                {allTemplates.map((template) => {
                  const selectedTemplate = selectedTemplates.find(
                    (st) => st.templateId === template.id,
                  );
                  const isSelected = !!selectedTemplate;

                  return (
                    <div
                      key={template.id}
                      className="flex items-center gap-3 p-2 bg-neutral-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTemplate(template.id)}
                        className="rounded border-neutral-300 text-[#5B9994] focus:ring-[#5B9994]"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {template.title}
                        </span>
                        <span className="text-xs text-neutral-600 ml-2">
                          (Created:{" "}
                          {new Date(template.created_at).toLocaleDateString()})
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-neutral-600">
                            Qty:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={selectedTemplate.quantity}
                            onChange={(e) =>
                              updateTemplateQuantity(
                                template.id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
              disabled={loading || !itemTitle.trim()}
              className="px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
