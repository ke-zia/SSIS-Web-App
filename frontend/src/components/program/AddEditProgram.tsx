import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
// import { Select } from "../ui/select"; <- replaced by portal select
import PortalSelect from "../ui/portal-select";
import { Program } from "../../types/program";
import { College } from "../../types/college";
import { createProgram, updateProgram } from "../../services/programService";
import {
  validateProgramCreate,
  isProgramCodeDuplicate,
} from "../../schemas/programs";
import { X } from "lucide-react";

interface AddEditProgramProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
  programs: Program[];
  colleges: College[];
  onSuccess: () => void;
}

const AddEditProgram: React.FC<AddEditProgramProps> = ({
  open,
  onOpenChange,
  program,
  programs,
  colleges,
  onSuccess,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState<{
    college_id: number | null;
    code: string;
    name: string;
  }>({
    college_id: null,
    code: "",
    name: "",
  });
  const [formErrors, setFormErrors] = useState<{
    college_id?: string;
    code?: string;
    name?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort colleges alphabetically by name (case-insensitive)
  const sortedCollegeOptions = useMemo(() => {
    const arr = [...colleges];
    arr.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return arr.map((c) => ({
      value: c.id.toString(),
      label: `${c.name} (${c.code})`,
      id: c.id,
    }));
  }, [colleges]);

  // When dialog opens, reset form state from program (if any)
  useEffect(() => {
    if (open) {
      if (program) {
        setFormState({
          college_id: program.college_id,
          code: program.code,
          name: program.name,
        });
      } else {
        setFormState({ college_id: null, code: "", name: "" });
      }
      setFormErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, program]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ensure click was on overlay (not on the content)
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const validationErrors = validateProgramCreate({
      college_id: formState.college_id,
      code: formState.code,
      name: formState.name,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    // Check for duplicate code
    if (
      isProgramCodeDuplicate(
        formState.code,
        programs,
        program?.id
      )
    ) {
      setFormErrors({
        code: `Program Code "${formState.code.trim()}" already exists`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = program != null;
      if (isEdit && program.id !== undefined) {
        await updateProgram(program.id, {
          college_id: formState.college_id!,
          code: formState.code.trim(),
          name: formState.name.trim(),
        });
      } else {
        await createProgram({
          college_id: formState.college_id!,
          code: formState.code.trim(),
          name: formState.name.trim(),
        });
      }

      // Success - close dialog and refresh data
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      // Handle API errors (e.g., duplicate code from server)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save program.";

      if (errorMessage.toLowerCase().includes("already exists")) {
        setFormErrors({
          code: `Program Code "${formState.code.trim()}" already exists`,
        });
      } else if (errorMessage.toLowerCase().includes("college")) {
        setFormErrors({
          college_id: errorMessage,
        });
      } else {
        setFormErrors({
          general: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormErrors({});
    onOpenChange(false);
  };

  // Render non-native modal (div-based) so portal popup can appear above it reliably
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

        .modal-content[role="dialog"] {
          animation: dialogFadeIn 0.3s ease-out;
        }
      `}</style>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-hidden={!open}
          onMouseDown={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal panel */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="modal-content relative m-auto h-auto w-full max-w-md max-h-[90vh] overflow-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl"
          >
            {/* Dialog Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6 pb-4 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {program ? "Edit Program" : "Add New Program"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {program
                    ? "Update the program details below"
                    : "Fill in the details to add a new program"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="ml-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* College Field - Portal dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      College
                    </label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>

                  {/* Wrapper div to give the PortalSelect a fixed width */}
                  <div className="w-full">
                    <PortalSelect
                      value={formState.college_id?.toString() || ""}
                      onChange={(val) =>
                        setFormState((prev) => ({
                          ...prev,
                          college_id: val ? parseInt(val) : null,
                        }))
                      }
                      options={sortedCollegeOptions.map((c) => ({
                        value: c.value,
                        label: c.label,
                      }))}
                      placeholder="Select a college"
                      className={`w-full h-11 transition-all duration-200 ${
                        formErrors.college_id
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                      }`}
                      maxVisibleRows={8}
                      ariaLabel="College"
                    />
                  </div>

                  {formErrors.college_id && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{formErrors.college_id}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Select the college this program belongs to
                  </p>
                </div>

                {/* Program Code Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Program Code
                    </label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Input
                    value={formState.code}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="e.g. BSCS"
                    className={`w-full h-11 transition-all duration-200 ${
                      formErrors.code
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                    }`}
                    autoFocus
                  />
                  {formErrors.code && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{formErrors.code}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Use a short, unique code for identification
                  </p>
                </div>

                {/* Program Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Program Name
                    </label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Input
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    className={`w-full h-11 transition-all duration-200 ${
                      formErrors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                    }`}
                  />
                  {formErrors.name && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{formErrors.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Enter the full name of the program
                  </p>
                </div>

                {/* General Error Message */}
                {formErrors.general && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium text-red-700">
                        {formErrors.general}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dialog Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="h-10 px-6 font-medium text-gray-700 hover:bg-gray-50 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-6 font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm hover:shadow"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>{program ? "Update Program" : "Add Program"}</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddEditProgram;