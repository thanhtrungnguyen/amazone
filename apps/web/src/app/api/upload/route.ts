import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@amazone/shared-utils";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "errors.unauthorized" },
      { status: 401 },
    );
  }

  const role = session.user.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "errors.forbidden" },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "errors.invalid_form_data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "errors.no_file_provided" },
      { status: 400 },
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "errors.invalid_file_type" },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "errors.file_too_large" },
      { status: 400 },
    );
  }

  // Generate unique filename
  const ext = MIME_TO_EXT[file.type] ?? ".bin";
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  // Resolve upload directory inside public/
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

  try {
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${uniqueName}`;

    logger.info(
      { userId: session.user.id, fileName: uniqueName, size: file.size },
      "Product image uploaded",
    );

    return NextResponse.json(
      { success: true, data: { url: publicUrl } },
      { status: 201 },
    );
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id },
      "Failed to save uploaded image",
    );
    return NextResponse.json(
      { error: "errors.upload_failed" },
      { status: 500 },
    );
  }
}
