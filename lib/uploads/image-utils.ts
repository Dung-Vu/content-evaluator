const MIME_EXTENSION_MAP: Record<string, string[]> = {
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function getAcceptedImageExtensions(
  acceptedMimeTypes: string[],
): string[] {
  return [...new Set(acceptedMimeTypes.flatMap((mime) => MIME_EXTENSION_MAP[mime] || []))];
}

export function isAcceptedImageFile(
  file: { name: string; type: string },
  acceptedMimeTypes: string[],
): boolean {
  const acceptedExtensions = getAcceptedImageExtensions(acceptedMimeTypes);
  const normalizedName = file.name.toLowerCase();

  return (
    acceptedMimeTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => normalizedName.endsWith(extension))
  );
}

export function getRemovedPreviewUrls(
  previousUrls: string[],
  nextUrls: string[],
): string[] {
  const nextUrlSet = new Set(nextUrls);
  return previousUrls.filter((url) => !nextUrlSet.has(url));
}