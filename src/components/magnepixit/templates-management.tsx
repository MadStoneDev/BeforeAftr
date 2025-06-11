"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { IconCubePlus, IconMoneybagPlus, IconPlus } from "@tabler/icons-react";

import SingleTemplate from "@/components/magnepixit/single-template";
import SingleItem from "@/components/magnepixit/single-item";
import CreateTemplateModal from "@/components/magnepixit/create-template-modal";
import CreateItemModal from "@/components/magnepixit/create-item-modal";

import { Database } from "../../../database.types";

type Item = Database["public"]["Tables"]["magnepixit_items"]["Row"];
type Template = Database["public"]["Tables"]["magnepixit_templates"]["Row"];
type TemplateItem =
  Database["public"]["Tables"]["magnepixit_templates_items"]["Row"];
type TemplateProduct =
  Database["public"]["Tables"]["magnepixit_templates_products"]["Row"];
type StoredProduct = Database["public"]["Tables"]["magnepixit_products"]["Row"];

interface EtsyProduct {
  id: string;
  title: string;
}

interface TemplatesManagementProps {
  initialTemplates: Template[];
  initialItems: Item[];
  initialTemplateItems: TemplateItem[];
  initialTemplateProducts: TemplateProduct[];
  initialStoredProducts: StoredProduct[];
  etsyProducts: EtsyProduct[];
}

export default function TemplatesManagement({
  initialTemplates,
  initialItems,
  initialTemplateItems,
  initialTemplateProducts,
  initialStoredProducts,
  etsyProducts,
}: TemplatesManagementProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "items">(
    "templates",
  );
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [templateItems, setTemplateItems] =
    useState<TemplateItem[]>(initialTemplateItems);
  const [templateProducts, setTemplateProducts] = useState<TemplateProduct[]>(
    initialTemplateProducts,
  );
  const [storedProducts, setStoredProducts] = useState<StoredProduct[]>(
    initialStoredProducts,
  );
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);

  const supabase = createClient();

  // Template handlers
  const handleTemplateCreated = (newTemplate: Template) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    toast.success("Template created successfully");
  };

  const handleTemplateUpdated = (updatedTemplate: Template) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === updatedTemplate.id ? updatedTemplate : template,
      ),
    );
    toast.success("Template updated successfully");
  };

  const handleTemplateDeleted = (templateId: number) => {
    setTemplates((prev) =>
      prev.filter((template) => template.id !== templateId),
    );
    // Also remove all related relationships
    setTemplateItems((prev) =>
      prev.filter((ti) => ti.template_id !== templateId),
    );
    setTemplateProducts((prev) =>
      prev.filter((tp) => tp.template_id !== templateId),
    );
    toast.success("Template deleted successfully");
  };

  const handleTemplateDuplicated = async (originalTemplate: Template) => {
    try {
      const { data, error } = await supabase
        .from("magnepixit_templates")
        .insert({
          title: `${originalTemplate.title} (Copy)`,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy template-item relationships (but NOT template-product relationships)
      const templateItemsForTemplate = templateItems.filter(
        (ti) => ti.template_id === originalTemplate.id,
      );

      if (templateItemsForTemplate.length > 0) {
        const newTemplateItems = templateItemsForTemplate.map((ti) => ({
          template_id: data.id,
          item_id: ti.item_id,
        }));

        const { error: relationError } = await supabase
          .from("magnepixit_templates_items")
          .insert(newTemplateItems);

        if (relationError) throw relationError;

        // Update local state
        const { data: createdRelations } = await supabase
          .from("magnepixit_templates_items")
          .select("*")
          .eq("template_id", data.id);

        if (createdRelations) {
          setTemplateItems((prev) => [...prev, ...createdRelations]);
        }
      }

      setTemplates((prev) => [data, ...prev]);
      toast.success("Template duplicated successfully");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  // Item handlers
  const handleItemCreated = (newItem: Item) => {
    setItems((prev) => [newItem, ...prev]);
    toast.success("Item created successfully");
  };

  const handleItemUpdated = (updatedItem: Item) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
    toast.success("Item updated successfully");
  };

  const handleItemDeleted = (itemId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    // Also remove all related relationships
    setTemplateItems((prev) => prev.filter((ti) => ti.item_id !== itemId));
    toast.success("Item deleted successfully");
  };

  const handleItemDuplicated = async (originalItem: Item) => {
    try {
      const { data, error } = await supabase
        .from("magnepixit_items")
        .insert({
          title: `${originalItem.title} (Copy)`,
          width: originalItem.width,
          height: originalItem.height,
          dimension_type: originalItem.dimension_type,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [data, ...prev]);
      toast.success("Item duplicated successfully");
    } catch (error) {
      console.error("Error duplicating item:", error);
      toast.error("Failed to duplicate item");
    }
  };

  // Helper functions to get related data
  const getItemsForTemplate = (templateId: number) => {
    const relatedItemIds = templateItems
      .filter((ti) => ti.template_id === templateId)
      .map((ti) => ti.item_id);
    return items.filter((item) => relatedItemIds.includes(item.id));
  };

  const getProductsForTemplate = (templateId: number) => {
    const relatedProductIds = templateProducts
      .filter((tp) => tp.template_id === templateId)
      .map((tp) => tp.product_id);
    return storedProducts.filter((product) =>
      relatedProductIds.includes(product.id),
    );
  };

  const getTemplatesForItem = (itemId: number) => {
    const relatedTemplateIds = templateItems
      .filter((ti) => ti.item_id === itemId)
      .map((ti) => ti.template_id);
    return templates.filter((template) =>
      relatedTemplateIds.includes(template.id),
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "templates"
                  ? "border-[#5B9994] text-[#5B9994]"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "items"
                  ? "border-[#5B9994] text-[#5B9994]"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Items ({items.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "templates" && (
          <>
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                Templates ({templates.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateItemModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <IconMoneybagPlus size={20} />
                  <span>Create Item</span>
                </button>
                <button
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
                >
                  <IconCubePlus size={20} />
                  <span>Create Template</span>
                </button>
              </div>
            </div>

            {templates.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-neutral-500 mb-4">
                  No templates created yet. Create your first template to get
                  started.
                </p>
                <button
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
                >
                  <IconPlus size={20} />
                  Create Your First Template
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {templates.map((template) => (
                  <SingleTemplate
                    key={template.id}
                    template={template}
                    items={getItemsForTemplate(template.id)}
                    products={getProductsForTemplate(template.id)}
                    allItems={items}
                    allStoredProducts={storedProducts}
                    etsyProducts={etsyProducts}
                    onUpdate={handleTemplateUpdated}
                    onDelete={handleTemplateDeleted}
                    onDuplicate={handleTemplateDuplicated}
                    onTemplateItemsChange={setTemplateItems}
                    onTemplateProductsChange={setTemplateProducts}
                    onStoredProductsChange={setStoredProducts}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "items" && (
          <>
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                Items ({items.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <IconCubePlus size={20} />
                  <span>Create Template</span>
                </button>
                <button
                  onClick={() => setShowCreateItemModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
                >
                  <IconMoneybagPlus size={20} />
                  <span>Create Item</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-neutral-500 mb-4">
                  No items created yet. Create your first item to get started.
                </p>
                <button
                  onClick={() => setShowCreateItemModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
                >
                  <IconPlus size={20} />
                  Create Your First Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <SingleItem
                    key={item.id}
                    item={item}
                    templates={getTemplatesForItem(item.id)}
                    allTemplates={templates}
                    onUpdate={handleItemUpdated}
                    onDelete={handleItemDeleted}
                    onDuplicate={handleItemDuplicated}
                    onTemplateItemsChange={setTemplateItems}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onCreated={handleTemplateCreated}
        allItems={items}
        allStoredProducts={storedProducts}
        etsyProducts={etsyProducts}
        onTemplateItemsChange={setTemplateItems}
        onTemplateProductsChange={setTemplateProducts}
        onStoredProductsChange={setStoredProducts}
      />

      <CreateItemModal
        isOpen={showCreateItemModal}
        onClose={() => setShowCreateItemModal(false)}
        onCreated={handleItemCreated}
        allTemplates={templates}
        onTemplateItemsChange={setTemplateItems}
      />
    </div>
  );
}
