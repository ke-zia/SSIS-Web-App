import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Student } from "../../types/student";
import { College } from "../../types/college";
import { Program } from "../../types/program";
import { createStudent, updateStudent, getProgramsByCollege } from "../../services/studentsService";
import {
  validateStudentCreate,
  isStudentIdDuplicate,
} from "../../schemas/students";
import { X } from "lucide-react";

interface AddEditStudentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  students: Student[];
  colleges: College[];
  programs: Program[];
  onSuccess: () => void;
}

const AddEditStudent: React.FC<AddEditStudentProps> = ({
  open,
  onOpenChange,
  student,
  students,
  colleges,
  programs: allPrograms,
  onSuccess,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formState, setFormState] = useState<{ 
    id: string;
    first_name: string;
    last_name: string;
    program_id: number | null;
    year_level: number | string;
    gender: string;
  }>({
    id: "",
    first_name: "",
    last_name: "",
    program_id: null,
    year_level: "",
    gender: "",
  });
  const [formErrors, setFormErrors] = useState<{
    id?: string;
    first_name?: string;
    last_name?: string;
    program_id?: string;
    year_level?: string;
    gender?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collegePrograms, setCollegePrograms] = useState<Program[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);

  // Handle dialog open/close
  useEffect(() => {
    if (dialogRef.current) {
      if (open) {
        dialogRef.current.showModal();
        // Reset form when dialog opens
        if (student) {
          setFormState({ 
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            program_id: student.program_id,
            year_level: student.year_level,
            gender: student.gender
          });
          // Find the college for this student's program
          if (student.program_id) {
            const program = allPrograms.find(p => p.id === student.program_id);
            if (program) {
              setSelectedCollegeId(program.college_id);
            }
          }
        } else {
          setFormState({ 
            id: "", 
            first_name: "", 
            last_name: "", 
            program_id: null, 
            year_level: "",
            gender: "" 
          });
          setSelectedCollegeId(null);
        }
        setFormErrors({});
        setCollegePrograms([]);
      } else {
        dialogRef.current.close();
      }
    }
  }, [open, student, allPrograms]);

  // Load programs when college is selected
  useEffect(() => {
    const loadCollegePrograms = async () => {
      if (selectedCollegeId) {
        try {
          const programs = await getProgramsByCollege(selectedCollegeId);
          setCollegePrograms(programs);
          // If editing and program exists in selected college, keep it
          // If editing and program is not in selected college, clear program
          if (student?.program_id) {
            const programExists = programs.some(p => p.id === student.program_id);
            if (!programExists) {
              setFormState(prev => ({ ...prev, program_id: null }));
            } else {
              // Ensure the program_id is set correctly even if it was cleared before
              setFormState(prev => ({ ...prev, program_id: student.program_id }));
            }
          }
        } catch (error) {
          console.error("Failed to load programs:", error);
        }
      } else {
        setCollegePrograms([]);
        if (!student?.program_id) {
          setFormState(prev => ({ ...prev, program_id: null }));
        }
      }
    };
    
    loadCollegePrograms();
  }, [selectedCollegeId, student]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      handleCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const validationErrors = validateStudentCreate({
      id: formState.id,
      first_name: formState.first_name,
      last_name: formState.last_name,
      program_id: formState.program_id,
      year_level: typeof formState.year_level === 'string' ? parseInt(formState.year_level) : formState.year_level,
      gender: formState.gender,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    // Check for duplicate student ID
    if (
      isStudentIdDuplicate(
        formState.id,
        students,
        student?.id
      )
    ) {
      setFormErrors({
        id: `Student ID "${formState.id.trim()}" already exists`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = student != null;
      const studentData = {
        id: formState.id.trim(),
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim(),
        program_id: formState.program_id,
        year_level: parseInt(formState.year_level.toString()),
        gender: formState.gender,
      };
      
      isEdit
        ? await updateStudent(student.id, studentData)
        : await createStudent(studentData);

      // Success - close dialog and refresh data
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save student.";
      
      if (errorMessage.toLowerCase().includes("already exists")) {
        setFormErrors({
          id: `Student ID "${formState.id.trim()}" already exists`,
        });
      } else if (errorMessage.toLowerCase().includes("format")) {
        setFormErrors({
          id: errorMessage,
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
          animation: dialogFadeIn 0.3s ease-out;
        }
      `}</style>
      
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 m-auto h-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {/* Dialog Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6 pb-4 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {student ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {student 
                ? "Update the student details below"
                : "Fill in the details to add a new student"
              }
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Input
                value={formState.id}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, id: e.target.value }))
                }
                placeholder="e.g. 2024-0001"
              className={`h-11 transition-all duration-200 ${
                  formErrors.id 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
              }`}
                autoFocus={!student}
              />
              {formErrors.id && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.id}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Format: NNNN-NNNN (e.g., 2024-0001)
              </p>
            </div>

            {/* First Name Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Input
                value={formState.first_name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, first_name: e.target.value }))
                }
                placeholder="e.g. Juan"
                className={`h-11 transition-all duration-200 ${
                  formErrors.first_name 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                }`}
              />
              {formErrors.first_name && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.first_name}</span>
                </div>
              )}
            </div>

            {/* Last Name Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Input
                value={formState.last_name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, last_name: e.target.value }))
                }
                placeholder="e.g. Dela Cruz"
                className={`h-11 transition-all duration-200 ${
                  formErrors.last_name 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                }`}
              />
              {formErrors.last_name && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.last_name}</span>
                </div>
              )}
            </div>

            {/* College Field - Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  College
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Select
                value={selectedCollegeId?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCollegeId(value ? parseInt(value) : null);
                }}
                className={`h-11 transition-all duration-200 ${
                  formErrors.program_id 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                }`}
              >
                <option value="">Select a college</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id.toString()}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500">
                Select a college to see available programs
              </p>
            </div>

            {/* Program Field - Dropdown (depends on selected college) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Program
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Select
                value={formState.program_id?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormState((prev) => ({ 
                    ...prev, 
                    program_id: value ? parseInt(value) : null 
                  }));
                }}
                disabled={!selectedCollegeId}
                className={`h-11 transition-all duration-200 ${
                  formErrors.program_id 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                } ${!selectedCollegeId ? 'bg-gray-50' : ''}`}
              >
                <option value="">Select a program</option>
                {collegePrograms.map((program) => (
                  <option key={program.id} value={program.id.toString()}>
                    {program.name} ({program.code})
                  </option>
                ))}
              </Select>
              {formErrors.program_id && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.program_id}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {selectedCollegeId 
                  ? "Select a program from the selected college"
                  : "Select a college first to see available programs"}
              </p>
            </div>

            {/* Year Level Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Year Level
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Select
                value={formState.year_level.toString()}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, year_level: e.target.value }))
                }
                className={`h-11 transition-all duration-200 ${
                  formErrors.year_level 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                }`}
              >
                <option value="">Select year level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </Select>
              {formErrors.year_level && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.year_level}</span>
                </div>
              )}
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Gender
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <Select
                value={formState.gender}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, gender: e.target.value }))
                }
                className={`h-11 transition-all duration-200 ${
                  formErrors.gender 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : "border-gray-300 focus:border-red-500 focus:ring-red-500"
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              {formErrors.gender && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.gender}</span>
                </div>
              )}
            </div>

            {/* General Error Message */}
            {formErrors.general && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-700">{formErrors.general}</span>
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
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {student ? "Update Student" : "Add Student"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
};

export default AddEditStudent;