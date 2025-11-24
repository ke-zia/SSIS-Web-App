import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import PortalSelect from "../ui/portal-select";
import { Student } from "../../types/student";
import { College } from "../../types/college";
import { Program } from "../../types/program";
import { createStudent, updateStudent, getProgramsByCollege, uploadStudentPhoto, deleteStudentPhoto, getPhotoPublicUrl } from "../../services/studentsService";
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
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

  // Photo related state
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  // Sort colleges alphabetically by name for the portal dropdown
  const sortedCollegeOptions = useMemo(() => {
    const arr = [...colleges];
    arr.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return arr.map((c) => ({
      value: c.id.toString(),
      label: `${c.name} (${c.code})`,
      id: c.id,
    }));
  }, [colleges]);

  // When modal opens, set form state and selected college (if editing)
  useEffect(() => {
    if (open) {
      if (student) {
        setFormState({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          program_id: student.program_id,
          year_level: student.year_level,
          gender: student.gender,
        });

        setExistingPhotoPath(student.photo || null);
        setPreviewUrl(student.photo ? getPhotoPublicUrl(student.photo) : null);
        setRemoveExistingPhoto(false);

        // If editing and student has program_id, try to find that program's college
        if (student.program_id) {
          const program = allPrograms.find((p) => p.id === student.program_id);
          if (program) {
            setSelectedCollegeId(program.college_id);
          } else {
            setSelectedCollegeId(null);
          }
        } else {
          setSelectedCollegeId(null);
        }
      } else {
        setFormState({
          id: "",
          first_name: "",
          last_name: "",
          program_id: null,
          year_level: "",
          gender: "",
        });
        setSelectedCollegeId(null);
        setExistingPhotoPath(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setRemoveExistingPhoto(false);
      }
      setFormErrors({});
      setCollegePrograms([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student, allPrograms]);

  // Load programs when selectedCollegeId changes
  useEffect(() => {
    const loadCollegePrograms = async () => {
      if (selectedCollegeId) {
        try {
          const programs = await getProgramsByCollege(selectedCollegeId);
          setCollegePrograms(programs);

          // If editing and program exists in selected college, keep it,
          // otherwise clear program_id
          if (student?.program_id) {
            const programExists = programs.some((p) => p.id === student.program_id);
            if (!programExists) {
              setFormState((prev) => ({ ...prev, program_id: null }));
            } else {
              setFormState((prev) => ({ ...prev, program_id: student.program_id }));
            }
          } else {
            // If not editing, don't preselect program
            setFormState((prev) => ({ ...prev, program_id: null }));
          }
        } catch (error) {
          console.error("Failed to load programs:", error);
          setCollegePrograms([]);
        }
      } else {
        setCollegePrograms([]);
        if (!student?.program_id) {
          setFormState((prev) => ({ ...prev, program_id: null }));
        }
      }
    };

    loadCollegePrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollegeId]);

  // Handle backdrop click — close when user clicks the overlay (not the content)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
    setRemoveExistingPhoto(false);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(existingPhotoPath ? getPhotoPublicUrl(existingPhotoPath) : null);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // mark to remove existing photo on save
    if (existingPhotoPath) {
      setRemoveExistingPhoto(true);
    } else {
      setRemoveExistingPhoto(false);
    }
  };

  // Replace the existing handleSubmit function with this updated version
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Convert year_level to number for validation if it's string
    const yearLevelValue =
      typeof formState.year_level === "string" && formState.year_level !== ""
        ? parseInt(formState.year_level, 10)
        : formState.year_level;

    const validationErrors = validateStudentCreate({
      id: formState.id,
      first_name: formState.first_name,
      last_name: formState.last_name,
      program_id: formState.program_id,
      year_level: typeof yearLevelValue === "number" ? yearLevelValue : undefined,
      gender: formState.gender,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    // Check duplicate ID
    if (
      isStudentIdDuplicate(formState.id, students, student?.id)
    ) {
      setFormErrors({
        id: `Student ID "${formState.id.trim()}" already exists`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!student;

      // Find the selected program to include program_code (required by API types)
      const selectedProgram =
        collegePrograms.find((p) => p.id === formState.program_id) ||
        allPrograms.find((p) => p.id === formState.program_id);

      const program_code = selectedProgram ? selectedProgram.code : "";

      const payload: any = {
        id: formState.id.trim(),
        first_name: formState.first_name.trim(),
        last_name: formState.last_name.trim(),
        program_id: formState.program_id,
        program_code,
        year_level: typeof yearLevelValue === "number" ? yearLevelValue : parseInt(formState.year_level as string, 10),
        gender: formState.gender,
      };

      // Handle photo upload / replacement / removal
      if (selectedFile) {
        // Upload new photo first
        const { path } = await uploadStudentPhoto(selectedFile);
        payload.photo = path;

        // If editing and had an existing photo, remove it AFTER successful upload
        if (isEdit && existingPhotoPath) {
          try {
            await deleteStudentPhoto(existingPhotoPath);
          } catch (err) {
            console.warn("Failed to delete old photo (non-fatal):", err);
          }
        }
      } else if (removeExistingPhoto) {
        // If user requested removal of existing photo
        if (existingPhotoPath) {
          try {
            await deleteStudentPhoto(existingPhotoPath);
          } catch (err) {
            console.warn("Failed to delete photo:", err);
          }
        }
        // Indicate to backend to clear the photo column
        payload.photo = "";
      } else if (existingPhotoPath && isEdit) {
        // No change to photo: keep existing path (do nothing)
        // Do not include photo in payload so backend won't change it
      }

      if (isEdit && student) {
        await updateStudent(student.id, payload);
      } else {
        await createStudent(payload);
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save student.";
      if (errorMessage.toLowerCase().includes("already exists")) {
        setFormErrors({ id: errorMessage });
      } else if (errorMessage.toLowerCase().includes("format")) {
        setFormErrors({ id: errorMessage });
      } else {
        setFormErrors({ general: errorMessage });
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
                  {student ? "Edit Student" : "Add New Student"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {student ? "Update the student details below" : "Fill in the details to add a new student"}
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

                {/* Student ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Student ID</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Input
                    value={formState.id}
                    onChange={(e) => setFormState((prev) => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g. 2024-0001"
                    className={`h-11 transition-all duration-200 ${formErrors.id ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
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
                  <p className="text-xs text-gray-500">Format: NNNN-NNNN (e.g., 2024-0001)</p>
                </div>

                {/* First name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Input
                    value={formState.first_name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, first_name: e.target.value }))}
                    placeholder="e.g. Juan"
                    className={`h-11 transition-all duration-200 ${formErrors.first_name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
                  />
                  {formErrors.first_name && <div className="text-sm text-red-500">{formErrors.first_name}</div>}
                </div>

                {/* Last name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Input
                    value={formState.last_name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, last_name: e.target.value }))}
                    placeholder="e.g. Dela Cruz"
                    className={`h-11 transition-all duration-200 ${formErrors.last_name ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
                  />
                  {formErrors.last_name && <div className="text-sm text-red-500">{formErrors.last_name}</div>}
                </div>

                {/* College (portal dropdown) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">College</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>

                  <div className="w-full">
                    <PortalSelect
                      value={selectedCollegeId?.toString() || ""}
                      onChange={(val) => {
                        const id = val ? parseInt(val) : null;
                        setSelectedCollegeId(id);
                      }}
                      options={sortedCollegeOptions.map((c) => ({ value: c.value, label: c.label }))}
                      placeholder="Select a college"
                      className={`h-11 w-full transition-all duration-200 ${formErrors.program_id ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
                      maxVisibleRows={8}
                      ariaLabel="College"
                    />
                  </div>

                  <p className="text-xs text-gray-500">Select a college to see available programs</p>
                </div>

                {/* Program (depends on selected college) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Program</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Select
                    value={formState.program_id?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormState((prev) => ({ ...prev, program_id: value ? parseInt(value) : null }));
                    }}
                    disabled={!selectedCollegeId}
                    className={`h-11 transition-all duration-200 ${formErrors.program_id ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"} ${!selectedCollegeId ? "bg-gray-50" : ""}`}
                  >
                    <option value="">Select a program</option>
                    {collegePrograms.map((prog) => (
                      <option key={prog.id} value={prog.id.toString()}>
                        {prog.name} ({prog.code})
                      </option>
                    ))}
                  </Select>
                  {formErrors.program_id && <div className="text-sm text-red-500">{formErrors.program_id}</div>}
                </div>

                {/* Year level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Year Level</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Select
                    value={formState.year_level.toString()}
                    onChange={(e) => setFormState((prev) => ({ ...prev, year_level: e.target.value }))}
                    className={`h-11 transition-all duration-200 ${formErrors.year_level ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
                  >
                    <option value="">Select year level</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </Select>
                  {formErrors.year_level && <div className="text-sm text-red-500">{formErrors.year_level}</div>}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <span className="text-xs text-red-500">Required</span>
                  </div>
                  <Select
                    value={formState.gender}
                    onChange={(e) => setFormState((prev) => ({ ...prev, gender: e.target.value }))}
                    className={`h-11 transition-all duration-200 ${formErrors.gender ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                  {formErrors.gender && <div className="text-sm text-red-500">{formErrors.gender}</div>}
                </div>

                {/* Photo upload*/}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Profile Photo</label>
                    <span className="text-xs text-gray-500">Optional</span>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors hover:border-red-300 focus-within:border-red-500 bg-gray-50/50">
                    <div className="max-w-xs mx-auto space-y-4">
                      {/* Upload icon - only show when no file is selected */}
                      {!selectedFile && !previewUrl && (
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                          <svg 
                            className="w-8 h-8 text-red-500" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={1.5} 
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                            />
                          </svg>
                        </div>
                      )}
                      
                      {/* Upload text */}
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {selectedFile ? "File Selected" : "Upload Your Photo"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedFile 
                            ? `` 
                            : "Choose a file to upload as your profile photo."}
                        </p>
                      </div>
                      
                      {/* Browse button and preview */}
                      <div className="space-y-3">
                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="student-photo-input"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const el = document.getElementById("student-photo-input") as HTMLInputElement | null;
                              el?.click();
                            }}
                            className="h-9 px-4 text-sm"
                          >
                            {selectedFile || previewUrl ? "Change Photo" : "Browse File"}
                          </Button>
                        </label>
                        
                      {/* Format info */}
                      <p className="text-xs text-gray-500">
                        Accepts any image format, up to 5 MB.
                      </p>

                        {/* Preview area */}
                        {(selectedFile || previewUrl) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-3">
                              {/* Image */}
                              <div className="mx-auto h-32 w-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                {previewUrl ? (
                                  <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                                    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none">
                                      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              {/* File info with remove button */}
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {selectedFile 
                                      ? selectedFile.name 
                                      : existingPhotoPath 
                                        ? "Current Photo" 
                                        : "Preview"}
                                  </p>
                                  {selectedFile && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {(selectedFile.size / 1024).toFixed(0)} KB • {selectedFile.type.split('/')[1]?.toUpperCase() || 'Image'}
                                    </p>
                                  )}
                                  {existingPhotoPath && !selectedFile && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemovePhoto}
                                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 ml-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* General error */}
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

                {/* Footer */}
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
                    className="h-10 px-6 font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm hover:shadow flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg 
                          className="animate-spin h-4 w-4 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      student ? "Update Student" : "Add Student"
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

export default AddEditStudent;