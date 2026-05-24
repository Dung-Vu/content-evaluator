"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, X } from "lucide-react";
import { BrandConfig } from "@/lib/brands";

export interface ImageFile {
  file: File;
  previewUrl: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  brandConfig: BrandConfig;
  brand: string;
  theme: {
    accentText: string;
  };
  onImagesChange: (newImages: ImageFile[]) => void;
  onError: (error: { message: string; code?: string } | null) => void;
}

// Client-side image compression using canvas
const compressImage = (
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8,
): Promise<File> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              },
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function ImageUploader({
  images,
  brandConfig,
  brand,
  theme,
  onImagesChange,
  onError,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  // Handle Image Selection & Parallel Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onError(null);

    const filesArray = Array.from(e.target.files);

    // Check total count limit
    if (images.length + filesArray.length > brandConfig.maxImages) {
      onError({
        message: `Tải lên tối đa ${brandConfig.maxImages} ảnh. Bạn đã chọn quá giới hạn.`,
        code: "TOO_MANY_IMAGES",
      });
      return;
    }

    try {
      // Validate all files
      for (const file of filesArray) {
        if (!brandConfig.acceptedImageTypes.includes(file.type)) {
          onError({
            message: `Định dạng '${file.name}' không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`,
            code: "UNSUPPORTED_IMAGE_TYPE",
          });
          return;
        }

        const maxSizeInBytes = brandConfig.maxImageSizeMb * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          onError({
            message: `Ảnh '${file.name}' vượt quá giới hạn ${brandConfig.maxImageSizeMb}MB.`,
            code: "IMAGE_TOO_LARGE",
          });
          return;
        }
      }

      // Parallel compression using Promise.all
      const compressedResults = await Promise.all(
        filesArray.map(async (file) => {
          try {
            const compressedFile = await compressImage(file);
            return {
              file: compressedFile,
              previewUrl: URL.createObjectURL(compressedFile),
            };
          } catch (err) {
            console.error("Compression failed, using original file:", err);
            return {
              file,
              previewUrl: URL.createObjectURL(file),
            };
          }
        }),
      );

      onImagesChange([...images, ...compressedResults]);
    } catch (err) {
      console.error("Error processing images:", err);
      onError({ message: "Có lỗi xảy ra khi tải ảnh lên." });
    }

    // Reset input value
    if (e.target.value) {
      e.target.value = "";
    }
  };

  // Remove Image
  const removeImage = (index: number) => {
    const copy = [...images];
    URL.revokeObjectURL(copy[index].previewUrl);
    copy.splice(index, 1);
    onImagesChange(copy);
  };

  // Drag and Drop styling
  const dragBorderClass = isDragging
    ? brand === "bonario"
      ? "border-amber-500 bg-slate-900/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
      : "border-indigo-500 bg-slate-900/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
    : "border-slate-800";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-300 tracking-wide">
          Đính kèm hình ảnh thiết kế (Layout) — Tùy chọn
        </label>
        <span className="text-[9px] text-slate-550 font-medium">
          Hỗ trợ tệp PNG, JPG, WEBP tối đa {brandConfig.maxImages} ảnh (Max{" "}
          {brandConfig.maxImageSizeMb}MB)
        </span>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            const fakeEvent = {
              target: {
                files: e.dataTransfer.files,
                value: "",
              },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            await handleImageChange(fakeEvent);
          }
        }}
        className={`bg-slate-950/40 border-2 border-dashed ${dragBorderClass} hover:border-${brand === "bonario" ? "amber-500/40" : "indigo-500/40"} hover:bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 group relative overflow-hidden`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept={brandConfig.acceptedImageTypes.join(",")}
          onChange={handleImageChange}
          className="hidden"
        />
        <div
          className={`p-3 bg-slate-950/80 border border-slate-800 text-slate-400 group-hover:${theme.accentText} group-hover:border-${brand === "bonario" ? "amber-500/30" : "indigo-500/30"} transition-all shadow-inner rounded-xl`}
        >
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-slate-200 mt-1">
          Nhấp hoặc kéo thả tệp layout thiết kế vào đây
        </p>
        <p className="text-[9px] text-slate-550 max-w-[280px] leading-normal">
          Hỗ trợ mô hình đa phương thức chấm điểm tương đồng visual.
        </p>
      </div>

      {/* Images Thumbnail List */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 mt-1 max-h-[220px] overflow-y-auto">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActivePreviewUrl(img.previewUrl);
              }}
              className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 group shadow-inner cursor-pointer hover:border-slate-650 transition-all duration-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`Upload Preview ${idx}`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-rose-950/90 text-rose-400 hover:text-rose-200 border border-rose-500/30 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setActivePreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePreviewUrl(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-950/85 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 hover:text-white transition-all shadow-md cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePreviewUrl}
              alt="Fullscreen Preview"
              className="w-full h-auto max-h-[80vh] object-contain block"
            />
          </div>
        </div>
      )}
    </div>
  );
}
