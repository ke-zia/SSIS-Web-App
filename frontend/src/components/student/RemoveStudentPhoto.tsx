import React from "react";
import { Button } from "../ui/button";
import { AlertTriangle, X } from "lucide-react";

interface RemoveStudentPhotoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // allow sync or async handlers
  onConfirm: () => Promise<void> | void;
  isRemoving?: boolean;
}

const RemoveStudentPhoto: React.FC<RemoveStudentPhotoProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isRemoving = false,
}) => {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => onOpenChange(false);

  // Await possible promise returned by onConfirm and close modal on success.
  const handleConfirm = async () => {
    try {
      if (isRemoving) return;
      const result = onConfirm();
      // Use unknown cast to avoid TypeScript error when converting void -> Promise<void>
      if (result && typeof (result as any).then === "function") {
        await (result as unknown as Promise<void>);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error while removing photo:", err);
      // keep modal open so caller can display error if needed
    }
  };

  return (
    <>
      <style>{`
        @keyframes dialogFadeIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .remove-photo-panel {
          animation: dialogFadeIn 0.18s ease-out;
        }
      `}</style>

      <div
        className="fixed inset-0 z-60 flex items-center justify-center"
        onMouseDown={handleBackdropClick}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          className="remove-photo-panel relative m-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Remove Profile Photo
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Confirm photo removal</p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isRemoving}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-red-50 border border-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-600">
                This will permanently remove the student’s profile photo.
                This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isRemoving}
                className="h-8 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isRemoving}
                className="h-8 px-4 text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                {isRemoving ? "Removing..." : "Remove Photo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemoveStudentPhoto;