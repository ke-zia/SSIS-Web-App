import { Student } from "../types/student";

export const validateStudentCreate = (data: {
  id?: string;
  first_name?: string;
  last_name?: string;
  program_id?: number | null;
  year_level?: number;
  gender?: string;
}): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  const studentId = data.id?.trim() || "";
  const firstName = data.first_name?.trim() || "";
  const lastName = data.last_name?.trim() || "";
  const yearLevel = data.year_level;
  const gender = data.gender?.trim() || "";

  // Validate student ID format (NNNN-NNNN)
  if (!studentId) {
    errors.id = "Student ID is required.";
  } else if (!/^\d{4}-\d{4}$/.test(studentId)) {
    errors.id = "Student ID must be in format NNNN-NNNN.";
  }

  if (!firstName) {
    errors.first_name = "First name is required.";
  }

  if (!lastName) {
    errors.last_name = "Last name is required.";
  }

  // Program ID is required
  if (!data.program_id) {
    errors.program_id = "Program is required.";
  }

  if (yearLevel === undefined || yearLevel === null) {
    errors.year_level = "Year level is required.";
  } else if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 5) {
    errors.year_level = "Year level must be between 1 and 5.";
  }

  if (!gender) {
    errors.gender = "Gender is required.";
  } else if (!["Male", "Female", "Other"].includes(gender)) {
    errors.gender = "Gender must be Male, Female, or Other.";
  }

  return errors;
};

export const isStudentIdDuplicate = (
  studentId: string,
  students: Student[],
  excludeId?: string
): boolean => {
  const trimmedId = studentId.trim();
  return students.some(
    (student) =>
      student.id === trimmedId && (!excludeId || student.id !== excludeId)
  );
};