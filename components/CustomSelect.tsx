"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X } from "lucide-react";

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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    const selectedIndex = options.findIndex((o) => o.value === value);
    setFocusIdx(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [value, options]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    buttonRef.current?.focus();
  }, []);

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
            closeDropdown();
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, focusIdx, options, onChange, openDropdown, closeDropdown],
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeOption = optionRefs.current[focusIdx >= 0 ? focusIdx : 0];
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [focusIdx, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const isSmallViewport = window.matchMedia("(max-width: 639px)").matches;
    if (!isSmallViewport) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const activeDescendantId =
    isOpen && focusIdx >= 0 ? `${id}-option-${focusIdx}` : undefined;

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
        aria-activedescendant={activeDescendantId}
        onClick={isOpen ? closeDropdown : openDropdown}
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
        <>
          <button
            type="button"
            aria-label={`Đóng ${id}`}
            onClick={closeDropdown}
            className="fixed inset-0 z-20 bg-slate-950/55 backdrop-blur-[1px] sm:hidden"
          />
          <div className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 max-h-[min(24rem,60vh)] overflow-hidden sm:absolute sm:inset-x-auto sm:bottom-auto sm:mt-2 sm:w-full sm:rounded-xl sm:max-h-60 sm:slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 sm:hidden">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Chon nhanh
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  {id === "contentType" ? "Loai content" : "Muc tieu phuc vu"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng lựa chọn"
                onClick={closeDropdown}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-300 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul
              ref={listRef}
              role="listbox"
              id={`${id}-listbox`}
              className="flex flex-col gap-0.5 overflow-y-auto px-1.5 py-1.5 sm:max-h-60"
            >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} className="px-1.5">
                  <button
                    id={`${id}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={opt.label}
                    onClick={() => {
                      onChange(opt.value);
                      closeDropdown();
                    }}
                    onMouseEnter={() => setFocusIdx(idx)}
                    ref={(element) => {
                      optionRefs.current[idx] = element;
                    }}
                    className={`w-full text-left text-[11px] sm:text-xs px-3 py-3 sm:py-2.5 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation ${
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
                      <span className="mt-1 block text-[11px] leading-relaxed text-slate-400 sm:block sm:text-[11px] max-sm:line-clamp-2">
                        {opt.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
