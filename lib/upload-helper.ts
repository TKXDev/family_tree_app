/**
 * Client-side helper functions for uploading files to Cloudinary
 */

/**
 * Uploads a file to Cloudinary via our API endpoint
 */
export const uploadFile = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Validates a file before upload
 */
export const validateFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): boolean => {
  const {
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  } = options;

  // Check file size (default 5MB max)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size exceeds the maximum allowed size of ${maxSizeMB}MB`
    );
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(
      `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  return true;
};

/**
 * Creates a data URL from a file (useful for previews)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
