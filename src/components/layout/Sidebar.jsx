/**
 * Role-based side navigation for authenticated areas. One component driven by
 * `items`/`footerSlot` props — no role-specific logic here.
 */
import { NavLink } from "react-router-dom";
import clsx from "clsx";

export function Sidebar({ items = [], footerSlot, logoHref = "/" }) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-mist/40 bg-white">
      <div className="border-b border-mist/40 px-4 py-4">
        <NavLink
          to={logoHref}
          className="text-subheading font-bold tracking-tight text-carbon"
        >
          LearnHub
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path.endsWith("/")}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-card border-l-[3px] px-3 py-2 text-body-sm transition-colors",
                    isActive
                      ? "border-apple-blue bg-apple-blue/5 font-medium text-link-blue"
                      : "border-transparent text-smoke hover:bg-frost hover:text-carbon"
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {footerSlot && (
        <div className="mt-auto border-t border-mist/40 px-4 py-3">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}
