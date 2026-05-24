"use client";

import { BrandKey } from "@/lib/brands";

interface BrandSwitcherProps {
  brand: BrandKey;
  onChange: (newBrand: BrandKey) => void;
}

export default function BrandSwitcher({ brand, onChange }: BrandSwitcherProps) {
  return (
    <div className="relative flex bg-slate-950/90 p-1 rounded-xl border border-slate-800/40 shadow-inner w-[200px] h-9 items-center">
      {/* Sliding Active Pill */}
      <div
        className={`absolute top-[3px] bottom-[3px] rounded-lg transition-all duration-300 ease-out shadow-lg ${
          brand === "bonario"
            ? "left-[3px] w-[95px] bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-600/30"
            : "left-[101px] w-[95px] bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-600/30"
        }`}
      />

      <button
        type="button"
        onClick={() => onChange("bonario")}
        className={`relative z-10 w-[96px] text-center text-xs font-bold tracking-wide transition-colors duration-300 cursor-pointer ${
          brand === "bonario"
            ? "text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Bonario
      </button>

      <button
        type="button"
        onClick={() => onChange("ordinaire")}
        className={`relative z-10 w-[96px] text-center text-xs font-bold tracking-wide transition-colors duration-300 cursor-pointer ${
          brand === "ordinaire"
            ? "text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Ordinaire
      </button>
    </div>
  );
}
