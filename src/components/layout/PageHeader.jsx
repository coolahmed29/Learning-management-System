/**
 * Standard page title block — the consistent <h1> + optional subheading strip
 * every route page uses (Courses, Dashboard, etc. currently inline this block
 * by hand). My Learning is the first consumer, worth promoting since all pages
 * share the exact same heading style (Rule: reusable UI stays independent).
 */
export function PageHeader({ title, description, className }) {
  return (
    <div className={className}>
      <h1 className="text-heading font-semibold text-carbon">{title}</h1>
      {description && <p className="mt-1 text-body text-ash">{description}</p>}
    </div>
  );
}