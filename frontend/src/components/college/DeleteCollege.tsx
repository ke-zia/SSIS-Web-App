import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { AlertTriangle, X } from "lucide-react";

interface DeleteCollegeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeName: string;
  collegeCode: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteCollege: React.FC<DeleteCollegeProps> = ({
  open,
  onOpenChange,
  collegeName,
  collegeCode,
  onConfirm,
  isDeleting,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Handle dialog open/close
  useEffect(() => {
    if (dialogRef.current) {
      if (open) {
        dialogRef.current.showModal();
      } else {
        dialogRef.current.close();
      }
    }
  }, [open]);

  // Handle backdrop click (clicking outside the dialog)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      {/* Inline styles for the animation */}
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
        className="fixed inset-0 z-50 m-auto h-auto w-full max-w-md max-h-145 rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {/* Dialog Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delete College
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Confirm deletion of this college
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
            aria-label="Close"
            disabled={isDeleting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dialog Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-red-50 border border-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Warning Message */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Are you sure you want to delete this college?
              </h3>
              <p className="text-gray-600 text-sm">
                This action cannot be undone. This will permanently delete:
              </p>
            </div>

            {/* College Details Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">College Code:</span>
                  <span className="text-sm font-medium text-gray-900">{collegeCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">College Name:</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{collegeName}</span>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-800 mb-1">Warning</p>
                  <p className="text-xs text-yellow-700">
                    Deleting this college may affect related departments and programs. 
                    Please ensure this action is necessary.
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isDeleting}
                className="h-8 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="h-8 px-4 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm hover:shadow"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete College"
                )}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default DeleteCollege;