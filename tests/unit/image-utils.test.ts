import { describe, expect, it } from "vitest";
import {
  getAcceptedImageExtensions,
  getRemovedPreviewUrls,
  isAcceptedImageFile,
} from "@/lib/uploads/image-utils";

describe("image-utils", () => {
  it("should accept .jpg files when jpeg is an allowed mime type", () => {
    expect(
      isAcceptedImageFile(
        { name: "hero-banner.JPG", type: "" },
        ["image/jpeg", "image/png", "image/webp"],
      ),
    ).toBe(true);
  });

  it("should derive the supported extensions from accepted mime types", () => {
    expect(
      getAcceptedImageExtensions(["image/jpeg", "image/png", "image/webp"]),
    ).toEqual([".jpeg", ".jpg", ".png", ".webp"]);
  });

  it("should only revoke preview URLs that disappear from the next state", () => {
    expect(
      getRemovedPreviewUrls(
        ["blob:keep", "blob:remove-1", "blob:remove-2"],
        ["blob:keep", "blob:new"],
      ),
    ).toEqual(["blob:remove-1", "blob:remove-2"]);
  });
});