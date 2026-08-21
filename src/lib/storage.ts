import { imageUploadPolicy } from "@/lib/validation";

export interface ImageStorage {
  createUploadUrl(input: { filename: string; mimeType: (typeof imageUploadPolicy.allowedMimeTypes)[number]; size: number }): Promise<{ uploadUrl: string; publicUrl: string }>;
  delete(publicUrl: string): Promise<void>;
}

export class UnconfiguredImageStorage implements ImageStorage {
  async createUploadUrl(): Promise<never> { throw new Error("IMAGE_STORAGE_NOT_CONFIGURED"); }
  async delete(): Promise<never> { throw new Error("IMAGE_STORAGE_NOT_CONFIGURED"); }
}
