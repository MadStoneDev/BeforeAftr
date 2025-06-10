"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { IconX, IconAlertTriangle } from "@tabler/icons-react";

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

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  allTemplates: Template[];
  onDeleted: (templateId: string) => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  template,
  allTemplates,
  onDeleted,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  // Find templates that use the same product_id (dependencies)
  const dependentTemplates = allTemplates.filter(
    (t) =>
      t.id !== template.id &&
      t.product_id === template.product_id &&
      template.product_id,
  );

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;

      onDeleted(template.id);
      onClose();
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <IconAlertTriangle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Delete Template</h3>
            <p className="text-sm text-neutral-600">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-neutral-100 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-neutral-700 mb-4">
            Are you sure you want to delete the template "
            {template.product_name}"?
          </p>

          {dependentTemplates.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium text-sm mb-2">
                Warning: Other templates are using the same product:
              </p>
              <ul className="text-yellow-700 text-sm space-y-1">
                {dependentTemplates.map((dep) => (
                  <li key={dep.id}>• {dep.product_name}</li>
                ))}
              </ul>
              <p className="text-yellow-800 text-xs mt-2">
                These templates will not be affected, but consider reviewing
                them.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Deleting..." : "Delete Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
