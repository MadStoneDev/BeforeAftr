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

import EditItemModal from "@/components/magnepixit/edit-item-modal";
import { Database } from "../../../database.types";

type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];

interface SingleItemProps {
  item: Item;
  templates: Template[];
  templateItems: TemplateItem[];
  allTemplates: Template[];
  onUpdate: (item: Item) => void;
  onDelete: (itemId: number) => void;
  onDuplicate: (item: Item) => void;
  onTemplateItemsChange: (templateItems: TemplateItem[]) => void;
}

export default function SingleItem({
  item,
  templates,
  templateItems,
  allTemplates,
  onUpdate,
  onDelete,
  onDuplicate,
  onTemplateItemsChange,
}: SingleItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const supabase = createClient();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
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
        .eq("item_id", item.id);

      if (templateItemsError) throw templateItemsError;

      // Delete the item
      const { error: itemError } = await supabase
        .from("magnepixit_items")
        .delete()
        .eq("id", item.id);

      if (itemError) throw itemError;

      onDelete(item.id);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
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
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {item.width}×{item.height}
                {item.dimension_type}
              </span>
              {templates.length > 0 && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {templates.length} template{templates.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="text-sm text-neutral-600">
              <p>Created: {new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
              title="Edit item"
              disabled={loading}
            >
              <IconEdit size={20} />
            </button>

            <button
              onClick={() => onDuplicate(item)}
              className="p-2 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
              title="Duplicate item"
              disabled={loading}
            >
              <IconCopy size={20} />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              title="Delete item"
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
            <div>
              <h4 className="font-medium text-sm text-neutral-700 mb-2">
                Dimensions:
              </h4>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Width:</span> {item.width}
                  {item.dimension_type}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Height:</span> {item.height}
                  {item.dimension_type}
                </p>
              </div>
            </div>

            {templates.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-neutral-700 mb-2">
                  Used in templates:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map((template) => {
                    const templateItem = templateItems.find(
                      (ti) =>
                        ti.template_id === template.id &&
                        ti.item_id === item.id,
                    );
                    const quantity = templateItem?.item_quantity || 1;

                    return (
                      <div
                        key={template.id}
                        className="p-3 bg-green-50 rounded-lg"
                      >
                        <p className="font-medium text-sm">{template.title}</p>
                        <p className="text-xs text-neutral-600">
                          Created:{" "}
                          {new Date(template.created_at).toLocaleDateString()}
                          {quantity > 1 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
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

            {templates.length === 0 && (
              <div className="text-center py-4 text-neutral-500 text-sm">
                This item is not used in any templates yet.
              </div>
            )}
          </div>
        )}
      </div>

      <EditItemModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        item={item}
        allTemplates={allTemplates}
        templateItems={templateItems}
        onUpdated={onUpdate}
        onTemplateItemsChange={onTemplateItemsChange}
      />
    </div>
  );
}
