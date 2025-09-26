/** College validation schemas. */

import { College } from "../types/college";

export interface CollegeFormData {
  code: string;
  name: string;
}

export function validateCollegeCreate(
  data: CollegeFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.code || !data.code.trim()) {
    errors.code = "College code is required.";
  }

  if (!data.name || !data.name.trim()) {
    errors.name = "College name is required.";
  }

  return errors;
}

export function isCollegeCodeDuplicate(
  code: string,
  colleges: College[],
  excludeId?: number
): boolean {
  const normalizedCode = code.trim().toUpperCase();
  return colleges.some(
    (college) =>
      college.code.toUpperCase() === normalizedCode &&
      college.id !== excludeId
  );
}

