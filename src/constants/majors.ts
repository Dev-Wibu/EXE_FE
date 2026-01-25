/**
 * Major (Chuyên ngành) constants for the application
 * Used across the entire project to ensure consistency
 */

export interface MajorOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Available major options for the application
 * Only Computer Science and Marketing as per requirements
 */
export const MAJOR_OPTIONS: MajorOption[] = [
  {
    value: "CNTT",
    label: "Công nghệ thông tin (CNTT)",
    description: "Khoa học máy tính, phần mềm, hệ thống thông tin",
  },
  {
    value: "Marketing",
    label: "Marketing",
    description: "Tiếp thị, quảng cáo, truyền thông",
  },
];

/**
 * Get major label by value
 * @param value - The major value (CNTT or Marketing)
 * @returns The display label or empty string if not found
 */
export const getMajorLabel = (value: string): string => {
  const major = MAJOR_OPTIONS.find((option) => option.value === value);
  return major?.label || "";
};

/**
 * Get major description by value
 * @param value - The major value (CNTT or Marketing)
 * @returns The description or empty string if not found
 */
export const getMajorDescription = (value: string): string => {
  const major = MAJOR_OPTIONS.find((option) => option.value === value);
  return major?.description || "";
};

/**
 * Validate if a major value is valid
 * @param value - The major value to validate
 * @returns true if valid, false otherwise
 */
export const isValidMajor = (value: string): boolean => {
  return MAJOR_OPTIONS.some((option) => option.value === value);
};
