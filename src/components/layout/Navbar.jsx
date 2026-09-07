/**
 * Global top navigation bar for PUBLIC pages only (Home, Courses, About,
 * Login/Register). Auth areas use Sidebar instead.
 */
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import { Button } from "../ui/Button/Button";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Courses", path: "/courses" },
  { label: "About", path: "/about" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    clsx(
      "px-2 py-2 text-body text-carbon transition-colors hover:text-link-blue",
      isActive ? "font-semibold text-link-blue" : "font-medium"
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-mist/40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-page items-center justify-between px-4 py-2">
        <Link
          to="/"
          className="text-subheading font-bold tracking-tight text-carbon"
        >
          LearnHub
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm">
            Login
          </Button>
          <Button variant="filled" size="sm">
            Register
          </Button>
        </div>

        <button
          type="button"
          className="rounded-card p-2 text-smoke hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-mist/40 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Main mobile">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-mist/40 pt-3">
              <Button variant="ghost" size="sm" fullWidth>
                Login
              </Button>
              <Button variant="filled" size="sm" fullWidth>
                Register
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
