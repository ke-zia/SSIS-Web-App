import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import ReactDOM from "react-dom";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PortalSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxVisibleRows?: number;
  ariaLabel?: string;
}

/**
 * Portal-based dropdown that renders the option list to document.body
 * so it won't be clipped by parent overflow. Uses position: fixed so
 * the popup follows the viewport and a very high z-index so it appears
 * above native <dialog> backdrops / stacking contexts.
 */
const PortalSelect: React.FC<PortalSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  maxVisibleRows = 8,
  ariaLabel,
}) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  // compute popup position (fixed) relative to viewport
  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = rect.width;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedRowHeight = 36; // px
    const maxHeight = Math.min(
      (maxVisibleRows + 0.5) * estimatedRowHeight,
      Math.max(120, Math.floor(Math.max(spaceBelow, spaceAbove) - 40))
    );

    // choose to open below if there's more space below or if not enough space above
    const openBelow = spaceBelow >= Math.min(200, maxHeight) || spaceBelow >= spaceAbove;

    const top = openBelow ? rect.bottom + 6 : rect.top - 6 - maxHeight;
    const left = rect.left;

    setPopupStyle({
      position: "fixed",
      top: Math.max(6, Math.round(top)),
      left: Math.max(6, Math.round(left)),
      minWidth: Math.round(width),
      maxHeight,
      // Extremely high z-index to ensure popup overlays native dialog/backdrop
      zIndex: 2147483647,
      overflow: "visible",
      pointerEvents: "auto",
    });
  };

  // useLayoutEffect to compute position before paint and avoid flicker/behind issues
  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, maxVisibleRows]);

  useEffect(() => {
    if (open) {
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, maxVisibleRows]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        open &&
        !triggerRef.current?.contains(t) &&
        !popupRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Keyboard handlers for navigation/selection
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev == null ? -1 : prev;
          do {
            next = next + 1;
            if (next >= options.length) next = 0;
          } while (options[next] && options[next].disabled);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev == null ? options.length : prev;
          do {
            next = next - 1;
            if (next < 0) next = options.length - 1;
          } while (options[next] && options[next].disabled);
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex != null && options[highlightedIndex]) {
          const opt = options[highlightedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            setOpen(false);
            triggerRef.current?.focus();
          }
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, highlightedIndex, options, onChange]);

  // When opening, highlight current selected index & scroll into view
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : null);
      setTimeout(() => {
        if (popupRef.current && idx >= 0) {
          const el = popupRef.current.querySelector<HTMLElement>(
            `[data-option-index="${idx}"]`
          );
          el?.scrollIntoView({ block: "nearest" });
        }
      }, 0);
    }
  }, [open, options, value]);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  const handleToggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleSelect = (opt: Option) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const popup = (
    <div
      ref={popupRef}
      style={popupStyle}
      role="listbox"
      aria-label={ariaLabel || placeholder}
      data-portal-select="true"
    >
      <div
        className="rounded-lg border bg-white shadow-lg"
        style={{
          boxShadow: "0 8px 28px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
          overflow: "hidden",
          outline: "1px solid rgba(220, 38, 38, 0.06)", // subtle outline for debugging
          pointerEvents: "auto",
        }}
      >
        <div
          className="max-h-[80vh] overflow-y-auto"
          style={{ maxHeight: popupStyle.maxHeight || 300 }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options</div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  data-option-index={idx}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                    opt.disabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"
                  } ${isHighlighted ? "bg-red-50" : "hover:bg-gray-50"} ${
                    isSelected ? "font-semibold text-gray-900" : "text-gray-700"
                  }`}
                  disabled={opt.disabled}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border bg-white text-sm ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        disabled={disabled}
      >
        <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLabel}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && ReactDOM.createPortal(popup, document.body)}
    </>
  );
};

export default PortalSelect;