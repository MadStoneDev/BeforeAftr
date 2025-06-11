"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { IconX } from "@tabler/icons-react";

import { Database } from "../../../database.types";

type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: Item) => void;
  allTemplates: Template[];
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
}

export default function CreateItemModal({
  isOpen,
  onClose,
  onCreated,
  allTemplates,
  onTemplateItemsChange,
}: CreateItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemWidth, setItemWidth] = useState(85);
  const [itemHeight, setItemHeight] = useState(55);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    setLoading(true);
    try {
      // Create the item
      const { data: item, error: itemError } = await supabase
        .from("magnepixit_items")
        .insert({
          title: itemTitle,
          width: itemWidth,
          height: itemHeight,
          dimension_type: "mm",
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Add item to selected templates
      if (selectedTemplates.length > 0) {
        const templateItemInserts = selectedTemplates.map((templateId) => ({
          template_id: templateId,
          item_id: item.id,
        }));

        const { data: templateItems, error: templateItemsError } =
          await supabase
            .from("magnepixit_templates_items")
            .insert(templateItemInserts)
            .select();

        if (templateItemsError) throw templateItemsError;

        // Update template items state
        onTemplateItemsChange(templateItems || []);
      }

      onCreated(item);

      // Reset form
      setItemTitle("");
      setItemWidth(85);
      setItemHeight(55);
      setSelectedTemplates([]);
      onClose();
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (templateId: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create New Item</h3>
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
                Add to Templates (Optional)
              </label>
              <div className="max-h-40 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-2">
                {allTemplates.map((template) => (
                  <label
                    key={template.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => toggleTemplate(template.id)}
                      className="rounded border-neutral-300 text-[#5B9994] focus:ring-[#5B9994]"
                    />
                    <span className="text-sm">{template.title}</span>
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
              disabled={loading || !itemTitle.trim()}
              className="px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
