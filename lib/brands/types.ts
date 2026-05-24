export type BrandKey = "bonario" | "ordinaire";

export interface SelectOption {
  value: string;
  label: string;
}

export interface CriterionConfig {
  name: string;
  question: string;
  passDesc: string;
  failDesc: string;
}

export interface BrandConfig {
  key: BrandKey;
  name: string;
  status: "ready" | "draft";
  maxImages: number;
  maxImageSizeMb: number;
  acceptedImageTypes: string[];
  contentTypeLabel: string;
  servingLabel: string;
  contentTypeOptions: SelectOption[];
  servingOptions: SelectOption[];
  criteria: CriterionConfig[];
  buildSystemPrompt(contentType: string, serving: string): string;
}
