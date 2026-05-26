import { NextRequest, NextResponse } from "next/server";
import { memoryRateLimiter } from "@/lib/rate-limit/memory-rate-limiter";
import { RequestValidationSchema } from "@/lib/validation/evaluate-response";
import { evaluateContentStream } from "@/lib/ai/evaluate";
import { BrandKey } from "@/lib/brands";

export async function POST(request: NextRequest) {
  // 1. Get Client IP for Rate Limiting
  // NOTE: x-forwarded-for can be spoofed by clients. In production, place nginx/cloudflare
  // in front to set this header trustworthily, then use NextRequest.ip for the real IP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Check rate limit
  const rateLimitCheck = memoryRateLimiter.check(ip);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Quá giới hạn lượt gửi. Vui lòng thử lại sau ${rateLimitCheck.retryAfterSeconds} giây.`,
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitCheck.retryAfterSeconds),
        },
      },
    );
  }

  try {
    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const brand = formData.get("brand") as string;
    const caption = formData.get("caption") as string;
    const contentType = formData.get("contentType") as string;
    const serving = formData.get("serving") as string;

    // Validate textual fields
    const parsedInput = RequestValidationSchema.safeParse({
      brand,
      caption,
      contentType,
      serving,
    });

    if (!parsedInput.success) {
      const errorMsg =
        parsedInput.error.issues[0]?.message || "Tham số đầu vào không hợp lệ";
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: errorMsg,
          },
        },
        { status: 400 },
      );
    }

    // 3. Process Uploaded Images
    const imageFiles: File[] = [];
    const allEntries = Array.from(formData.entries());

    for (const [key, value] of allEntries) {
      // Look for files under "images", "images[]" or numbered array index fields like "images[0]"
      if (
        (key === "images" || key === "images[]" || key.startsWith("images[")) &&
        value instanceof File &&
        value.size > 0
      ) {
        imageFiles.push(value);
      }
    }

    // Validate image count (max 20)
    if (imageFiles.length > 20) {
      return NextResponse.json(
        {
          error: {
            code: "TOO_MANY_IMAGES",
            message:
              "Tải lên quá nhiều ảnh. Tối đa chỉ được tải lên 20 hình ảnh.",
          },
        },
        { status: 400 },
      );
    }

    const processedImages: { base64: string; mimeType: string }[] = [];

    // Validate individual image properties
    for (const file of imageFiles) {
      // Validate image type
      const acceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!acceptedMimeTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: {
              code: "UNSUPPORTED_IMAGE_TYPE",
              message: `Định dạng ảnh '${file.name}' không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`,
            },
          },
          { status: 400 },
        );
      }

      // Validate image size (max 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return NextResponse.json(
          {
            error: {
              code: "IMAGE_TOO_LARGE",
              message: `Ảnh '${file.name}' vượt quá kích thước 5MB cho phép.`,
            },
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      processedImages.push({
        base64,
        mimeType: file.type,
      });
    }

    // 4. Run Evaluation Logic (Bailian AI or Local Mock via Streaming)
    const stream = await evaluateContentStream(
      brand as BrandKey,
      caption,
      contentType,
      serving,
      processedImages,
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("API error during content evaluation:", errorMessage);

    // Map AI/System errors to appropriate response codes
    let status = 500;
    let code = "UNKNOWN_ERROR";
    let message = "Đã xảy ra lỗi không xác định trên hệ thống.";
    let details: string | undefined;

    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;
      const errMsg = typeof err.message === "string" ? err.message : "";
      const errStatus = typeof err.status === "number" ? err.status : undefined;
      const errName = typeof err.name === "string" ? err.name : "";

      details = errMsg;

      if (
        errStatus === 401 ||
        errMsg.includes("API key") ||
        errMsg.includes("ApiKey")
      ) {
        code = "AI_AUTH_ERROR";
        message = "Lỗi xác thực API key nhà cung cấp dịch vụ AI.";
      } else if (errStatus === 429) {
        status = 429;
        code = "AI_RATE_LIMIT";
        message = "Dịch vụ AI đang quá tải lượt gọi. Vui lòng thử lại sau.";
      } else if (errName === "ZodError" || errMsg.includes("validation")) {
        status = 422;
        code = "MODEL_INVALID_JSON";
        message = "Không thể phân tích dữ liệu trả về từ mô hình AI.";
      }
    }

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: {
          code,
          message,
          ...(isDev && details ? { details } : {}),
        },
      },
      { status },
    );
  }
}
