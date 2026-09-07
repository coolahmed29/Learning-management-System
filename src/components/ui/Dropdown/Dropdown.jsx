/**
 * Generic dropdown/select-like menu — sort dropdowns, account menus, filter selects.
 */
import { cloneElement, useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function Dropdown({
  trigger,
  items = [],
  onSelect,
  align = "left",
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleKeyDown(e) {
    if (!isOpen) return;

    const enabledIndexes = items
      .map((item, i) => (item.disabled ? -1 : i))
      .filter((i) => i >= 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = enabledIndexes.indexOf(highlightedIndex);
      const next = enabledIndexes[(current + 1) % enabledIndexes.length];
      setHighlightedIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = enabledIndexes.indexOf(highlightedIndex);
      const next =
        enabledIndexes[
          (current - 1 + enabledIndexes.length) % enabledIndexes.length
        ];
      setHighlightedIndex(next);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        const item = items[highlightedIndex];
        handleSelect(item);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleSelect(item) {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    if (onSelect) onSelect(item.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  const enabledCount = items.filter((i) => !i.disabled).length;

  return (
    <div
      ref={containerRef}
      className={clsx("relative inline-block", className)}
      onKeyDown={handleKeyDown}
    >
      {cloneElement(trigger, {
        onClick: () => {
          setIsOpen((o) => {
            if (!o) setHighlightedIndex(-1);
            return !o;
          });
        },
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        },
        "aria-expanded": isOpen,
        "aria-haspopup": "menu",
      })}

      {isOpen && enabledCount > 0 && (
        <div
          role="menu"
          ref={listRef}
          className={clsx(
            "absolute z-50 mt-1 min-w-[180px] rounded-card border border-mist/50 bg-white py-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => {
            const isDisabled = item.disabled;
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={item.value}
                role="menuitem"
                type="button"
                disabled={isDisabled}
                onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
                onClick={() => handleSelect(item)}
                className={clsx(
                  "block w-full px-4 py-2 text-left text-body-sm",
                  isDisabled && "cursor-not-allowed text-mist",
                  !isDisabled && isHighlighted && "bg-frost",
                  !isDisabled && !isHighlighted && "hover:bg-frost"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
