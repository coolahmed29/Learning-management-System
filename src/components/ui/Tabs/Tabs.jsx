/**
 * Generic tab-switcher primitive — promoted to components/ui/ rather than kept
 * feature-local, since Course Details (Overview/Curriculum/Instructor/Reviews)
 * and Settings (Account/Password/Notifications/Danger Zone) both need this exact
 * pattern. Reusable UI stays independent from business features (Rule 4).
 *
 * Fully controlled (activeTab/onChange come from the parent) and render-less of
 * content: Tabs only renders the tab-header row — the caller renders the active
 * tab's content itself based on activeTab. No internal "which tab" state.
 */
import { useRef } from "react";
import clsx from "clsx";

export function Tabs({ tabs, activeTab, onChange, ariaLabel = "Tabs", className }) {
  const tabRefs = useRef({});

  function selectTab(index, { moveFocus = true } = {}) {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    if (moveFocus) {
      tabRefs.current[tab.id]?.focus();
    }
  }

  // Standard ARIA tabs keyboard pattern: Arrow Left/Right move between tabs,
  // Home/End jump to first/last.
  function handleKeyDown(event) {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const lastIndex = tabs.length - 1;
    let nextIndex;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case "ArrowLeft":
        event.preventDefault();
        nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    selectTab(nextIndex);
  }

  return (
    // Hairline rule under the whole row keeps the navigation style consistent
    // with the rest of the design system.
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={clsx("flex gap-2 border-b border-mist/40", className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() =>
              // Standard pattern: mouse click selects without stealing focus.
              selectTab(
                tabs.findIndex((t) => t.id === tab.id),
                { moveFocus: false }
              )
            }
            className={`border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue ${
              isActive
                ? "border-apple-blue text-carbon"
                : "border-transparent text-ash hover:text-graphite"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}