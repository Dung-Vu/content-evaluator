import { BrandConfig, BrandKey } from "./types";
import { bonarioConfig } from "./bonario";
import { ordinaireConfig } from "./ordinaire";

export * from "./types";
export { bonarioConfig } from "./bonario";
export { ordinaireConfig } from "./ordinaire";

const brandMap: Record<BrandKey, BrandConfig> = {
  bonario: bonarioConfig,
  ordinaire: ordinaireConfig,
};

export function getBrandConfig(brand: BrandKey): BrandConfig {
  const config = brandMap[brand];
  if (!config) {
    throw new Error(`Unsupported brand: ${brand}`);
  }
  return config;
}
