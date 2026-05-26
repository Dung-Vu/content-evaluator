"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  const openDropdown = useCallback(() => {
    setFocusIdx(options.findIndex((o) => o.value === value));
    setIsOpen(true);
  }, [value, options]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIdx((prev) => (prev + 1) % options.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIdx((prev) => (prev - 1 + options.length) % options.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusIdx >= 0 && focusIdx < options.length) {
            onChange(options[focusIdx].value);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
      }
    },
    [isOpen, focusIdx, options, onChange, openDropdown],
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedDisplayText = selectedOption ? selectedOption.value : placeholder;

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
    <div className="relative w-full" ref={containerRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={isOpen ? () => setIsOpen(false) : openDropdown}
        onKeyDown={handleKeyDown}
        title={selectedOption?.label || placeholder}
        className={`w-full glass-input text-[11px] sm:text-xs text-left text-slate-200 rounded-xl px-3.5 sm:px-4 py-3 focus:outline-none ${focusRingClass} flex items-center justify-between gap-3 cursor-pointer transition-all duration-300`}
      >
        <span
          className={
            selectedOption
              ? "min-w-0 flex-1 truncate text-slate-200 font-medium"
              : "min-w-0 flex-1 truncate text-slate-500"
          }
        >
          {selectedDisplayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 w-full mt-2 bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[min(18rem,50vh)] sm:max-h-60 overflow-y-auto">
          <ul ref={listRef} role="listbox" id={`${id}-listbox`} className="py-1.5 flex flex-col gap-0.5">
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} className="px-1.5">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={opt.label}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusIdx(idx)}
                    className={`w-full text-left text-[11px] sm:text-xs px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      idx === focusIdx
                        ? activeOptionClass
                        : isSelected
                          ? activeOptionClass
                          : `text-slate-300 ${activeHoverClass}`
                    }`}
                  >
                    <span className="block font-semibold leading-snug text-slate-100">
                      {opt.value}
                    </span>
                    {opt.label !== opt.value && (
                      <span className="mt-1 hidden sm:block text-[11px] leading-relaxed text-slate-400">
                        {opt.label}
                      </span>
                    )}
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
