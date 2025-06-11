"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

import {
  IconDownload,
  IconX,
  IconCheck,
  IconCopy,
  IconPhotoOff,
  IconPhoto,
} from "@tabler/icons-react";

import { toast } from "react-hot-toast";
import RejectModal from "@/components/magnepixit/reject-modal";

interface Order {
  id: string;
  created_at: string;
  updated_on: string;
  order_no: string;
  customer_name: string;
  status: string;
  access_code: string;
  access_history: string | null;
  purge_on: string | null;
  customer_email: string;
  order_date: string;
}

interface Photo {
  id: string;
  created_at: string;
  original_photo: string;
  cropped_photo: string;
  order_id: string;
}

interface OrderItemProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export default function OrderItem({ order, onStatusUpdate }: OrderItemProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const supabase = createClient();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "RC":
        return {
          text: "Photos Uploaded",
          color: "bg-magnepixit-quaternary text-white",
          backgroundColor: "bg-magnepixit-quaternary",
        };
      case "RI":
        return {
          text: "Rejected",
          color: "bg-magnepixit-tertiary text-white",
          backgroundColor: "bg-magnepixit-tertiary",
        };
      case "OC":
        return {
          text: "Completed",
          color: "bg-magnepixit-primary text-white",
          backgroundColor: "bg-magnepixit-primary",
        };
      default:
        return {
          text: "Pending",
          color: "bg-magnepixit-secondary text-white",
          backgroundColor: "bg-magnepixit-secondary",
        };
    }
  };

  const loadPhotos = useCallback(async () => {
    if (photosLoaded) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("magnepixit_photos")
        .select("*")
        .eq("order_id", order.order_no)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
      setPhotosLoaded(true);
    } catch (error) {
      console.error("Error loading photos:", error);
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [photosLoaded, order.order_no, supabase]);

  const downloadPhotos = async () => {
    await loadPhotos();

    if (photos.length === 0) {
      toast.error("No photos found for this order");
      return;
    }

    try {
      for (const photo of photos) {
        if (photo.cropped_photo) {
          const { data, error } = await supabase.storage
            .from("magnepixit_photos")
            .download(photo.cropped_photo);

          if (error) throw error;

          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${order.order_no}_photo_${photo.id.slice(0, 8)}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      toast.success(`Downloaded ${photos.length} photos`);
    } catch (error) {
      console.error("Error downloading photos:", error);
      toast.error("Failed to download photos");
    }
  };

  const completeOrder = async () => {
    try {
      const purgeDate = new Date();
      purgeDate.setDate(purgeDate.getDate() + 30);

      const { error } = await supabase
        .from("magnepixit_orders")
        .update({
          status: "OC",
          purge_on: purgeDate.toISOString(),
          updated_on: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      onStatusUpdate(order.id, "OC");
      toast.success("Order marked as completed");
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Failed to complete order");
    }
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(order.access_code);
    toast.success("Access Code copied to clipboard");
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && !photosLoaded) {
      loadPhotos();
    }
  };

  const statusDisplay = getStatusDisplay(order.status);

  return (
    <article
      className={`group bg-neutral-100 hover:bg-neutral-200 transition-all duration-300 ease-in-out`}
    >
      <div className="p-6 transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between">
          <div className="flex-grow space-y-6">
            <div className={`flex flex-col items-start gap-1 mb-2`}>
              <h3 className={`py-2 font-bold`}>
                Order:{" "}
                <span className={`p-1 font-normal`}>{order.order_no}</span>
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${statusDisplay.color}`}
              >
                {statusDisplay.text}
              </span>
            </div>

            <div className={`grid gap-3 text-sm text-neutral-500`}>
              <p>
                <span className="font-medium">Customer:</span>{" "}
                {order.customer_name}
              </p>
              <p>
                <span className="font-medium">Customer Email:</span>{" "}
                {order.customer_email}
              </p>
              <p>
                <span className="font-medium">Order Date:</span>{" "}
                {new Date(order.order_date).toLocaleDateString()}
              </p>
            </div>

            <div
              className={`mt-3 px-4 py-2 inline-flex items-center gap-2 rounded-full bg-neutral-300 group-hover:bg-neutral-400/80 shadow-md transition-all duration-300 ease-in-out`}
            >
              <span className={`text-sm font-medium`}>Access Code:</span>
              <code
                className={`px-2 py-0.5 bg-neutral-100 rounded text-sm font-mono`}
              >
                {order.access_code}
              </code>
              <button
                onClick={copyAccessCode}
                className="p-1 hover:bg-neutral-100 rounded  transition-all duration-300 ease-in-out"
                title="Copy access code"
              >
                <IconCopy size={16} />
              </button>
            </div>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-neutral-400">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium">Photos ({photos.length})</h4>
                  {loading && (
                    <div className="w-4 h-4 border-2 border-magnepixit-secondary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square bg-neutral-100 rounded-lg overflow-hidden"
                      >
                        {photo.cropped_photo && (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.cropped_photo}`}
                            alt={`Photo ${photo.id}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">
                    No photos uploaded yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 ml-4">
            <button
              onClick={toggleExpanded}
              className="p-2 hover:bg-white rounded-lg transition-all duration-300 ease-in-out"
              title={expanded ? "Hide photos" : "View photos"}
            >
              {expanded ? <IconPhotoOff size={20} /> : <IconPhoto size={20} />}
            </button>

            <button
              onClick={downloadPhotos}
              className="p-2 hover:bg-magnepixit-secondary hover:text-white rounded-lg transition-all duration-300 ease-in-out"
              title="Download all photos"
            >
              <IconDownload size={20} />
            </button>

            {order.status !== "OC" && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="p-2 hover:bg-magnepixit-tertiary hover:text-white rounded-lg transition-all duration-300 ease-in-out"
                  title="Reject order"
                >
                  <IconX size={20} />
                </button>

                <button
                  onClick={completeOrder}
                  className="p-2 hover:bg-magnepixit-primary hover:text-white rounded-lg transition-all duration-300 ease-in-out"
                  title="Mark as completed"
                >
                  <IconCheck size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        order={order}
        onReject={(reason) => {
          onStatusUpdate(order.id, "RI");
          setShowRejectModal(false);
          toast.success("Order rejected and customer notified");
        }}
      />
    </article>
  );
}
