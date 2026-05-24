import { BrandConfig, BrandKey } from "./types";
import { bonarioConfig } from "./bonario";
import { ordinaireConfig } from "./ordinaire";

export * from "./types";
export { bonarioConfig } from "./bonario";
export { ordinaireConfig } from "./ordinaire";

export function getBrandConfig(brand: BrandKey): BrandConfig {
  if (brand === "bonario") {
    return bonarioConfig;
  }
  if (brand === "ordinaire") {
    return ordinaireConfig;
  }
  throw new Error(`Unsupported brand: ${brand}`);
}
