import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { AlertTriangle, X } from "lucide-react";

interface RemoveStudentPhotoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isRemoving?: boolean;
}

const RemoveStudentPhoto: React.FC<RemoveStudentPhotoProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isRemoving = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    open ? dialogRef.current.showModal() : dialogRef.current.close();
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => onOpenChange(false);
  const handleConfirm = () => onConfirm();

  return (
    <>
      <style>{`
        @keyframes dialogFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        dialog[open] {
          animation: dialogFadeIn 0.2s ease-out;
        }
      `}</style>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Remove Profile Photo
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Confirm photo removal
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={isRemoving}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure?
            </h3>
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
      </dialog>
    </>
  );
};

export default RemoveStudentPhoto;
