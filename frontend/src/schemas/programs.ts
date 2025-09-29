/** Program validation schemas. */

import { Program } from "../types/program";

export interface ProgramFormData {
  college_id: number | null;
  code: string;
  name: string;
}

export function validateProgramCreate(
  data: ProgramFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.college_id || data.college_id === null) {
    errors.college_id = "College selection is required.";
  }

  if (!data.code || !data.code.trim()) {
    errors.code = "Program code is required.";
  }

  if (!data.name || !data.name.trim()) {
    errors.name = "Program name is required.";
  }

  return errors;
}

export function isProgramCodeDuplicate(
  code: string,
  programs: Program[],
  excludeId?: number
): boolean {
  const normalizedCode = code.trim().toUpperCase();
  return programs.some(
    (program) =>
      program.code.toUpperCase() === normalizedCode &&
      program.id !== excludeId
  );
}

