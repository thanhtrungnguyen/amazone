"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImageUploadProps {
  /** Called with the public URL after a successful upload */
  onUpload: (url: string) => void;
  /** Called when the image is removed */
  onRemove?: () => void;
  /** Pre-existing image URL (e.g. when editing a product) */
  value?: string;
  /** Additional CSS classes for the root container */
  className?: string;
  /** Whether the upload control is disabled */
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  onRemove,
  value,
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, WebP, and GIF images are allowed.";
    }
    if (file.size > MAX_SIZE) {
      return "File size must be under 5 MB.";
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(0);

      // Create a local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Use XMLHttpRequest for progress tracking
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText) as {
                  success?: boolean;
                  data?: { url: string };
                  error?: string;
                };
                if (data.success && data.data?.url) {
                  resolve(data.data.url);
                } else {
                  reject(new Error(data.error ?? "Upload failed"));
                }
              } catch {
                reject(new Error("Invalid server response"));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText) as {
                  error?: string;
                };
                reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
              } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled"));
          });

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        // Revoke the local blob and use the real URL
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(url);
        onUpload(url);
      } catch (err) {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(value ?? null);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [onUpload, validateFile, value],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void uploadFile(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        void uploadFile(file);
      }
    },
    [disabled, isUploading, uploadFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragOver(true);
      }
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    },
    [],
  );

  const handleRemove = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onRemove?.();
  }, [previewUrl, onRemove]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  // --- Render ---

  // Image preview state
  if (previewUrl && !isUploading) {
    return (
      <div className={cn("relative group", className)}>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={previewUrl}
            alt="Product image preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleRemove}
          disabled={disabled}
          aria-label="Remove image"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  // Upload / drop zone state
  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product image"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || isUploading) && "pointer-events-none opacity-60",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Uploading... {progress}%
            </p>
            {/* Progress bar */}
            <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            {isDragOver ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {isDragOver ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-muted-foreground/75">
                JPEG, PNG, WebP, or GIF (max 5 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
