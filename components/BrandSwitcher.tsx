"use client";

import { BrandKey } from "@/lib/brands";

interface BrandSwitcherProps {
  brand: BrandKey;
  onChange: (newBrand: BrandKey) => void;
}

export default function BrandSwitcher({ brand, onChange }: BrandSwitcherProps) {
  const brands: BrandKey[] = ["bonario", "ordinaire"];
  return (
    <div className="relative flex bg-slate-950/90 p-1 rounded-xl border border-slate-800/40 shadow-inner w-[180px] sm:w-[200px] h-9 items-center">
      <div
        className="absolute top-[3px] bottom-[3px] rounded-lg transition-all duration-300 ease-out shadow-lg"
        style={{
          left: brand === "bonario" ? "3px" : `calc(50% + 1px)`,
          width: `calc(50% - 5px)`,
          background: brand === "bonario"
            ? "linear-gradient(to right, #d97706, #b45309)"
            : "linear-gradient(to right, #4f46e5, #4338ca)",
          boxShadow: brand === "bonario"
            ? "0 4px 12px rgba(217, 119, 6, 0.3)"
            : "0 4px 12px rgba(79, 70, 229, 0.3)",
        }}
      />
      {brands.map((b) => (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={brand === b}
          aria-label={`${b} brand`}
          onClick={() => onChange(b)}
          className={`relative z-10 flex-1 text-center text-xs font-bold tracking-wide transition-colors duration-300 cursor-pointer ${
            brand === b
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {b === "bonario" ? "Bonario" : "Ordinaire"}
        </button>
      ))}
    </div>
  );
}
