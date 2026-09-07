/**
 * Site-wide footer for public pages — flat, typographic, multi-column link grid.
 */
import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Courses", to: "/courses" },
      { label: "Categories", to: "/courses" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About", to: "/about" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-mist/40 bg-frost">
      <div className="mx-auto max-w-page px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-subheading font-bold tracking-tight text-carbon">
              LearnHub
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="mb-3 text-caption font-semibold uppercase tracking-wide text-graphite">
                {column.title}
              </p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-body-sm text-ash transition-colors hover:text-link-blue"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-mist/40 pt-4">
          <p className="text-caption text-ash">
            &copy; {year} LearnHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
