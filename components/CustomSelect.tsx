"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  brand: "bonario" | "ordinaire";
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  brand,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Styling details based on brand
  const activeHoverClass =
    brand === "bonario"
      ? "hover:bg-amber-500/20 hover:text-amber-300"
      : "hover:bg-indigo-500/20 hover:text-indigo-300";

  const activeOptionClass =
    brand === "bonario"
      ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
      : "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20";

  const focusRingClass =
    brand === "bonario"
      ? "focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
      : "focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10";

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full glass-input text-xs text-left text-slate-200 rounded-xl px-4 py-3 focus:outline-none ${focusRingClass} flex items-center justify-between cursor-pointer transition-all duration-300`}
      >
        <span
          className={
            selectedOption ? "text-slate-200 font-medium" : "text-slate-500"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 w-full mt-2 bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          <ul className="py-1.5 flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} className="px-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? activeOptionClass
                        : `text-slate-300 ${activeHoverClass}`
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
