/**
 * Top section of the Course Details page — title, short description, instructor
 * name, rating, student count, and a media preview. Two-column layout on
 * desktop (text left / media right) collapsing to stacked on mobile.
 */
function formatRating(rating) {
  return rating != null ? rating.toFixed(1) : "N/A";
}

function formatStudentCount(count) {
  const n = Number(count);
  if (Number.isNaN(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function CourseHeader({ course }) {
  const {
    title,
    shortDescription,
    instructorName,
    rating,
    studentCount,
    thumbnailUrl,
  } = course;

  return (
    <header className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div>
        {/* No truncation here — long titles must wrap gracefully (unlike
            CourseCard's grid context where truncation makes sense). */}
        <h1 className="text-heading font-semibold text-carbon">{title}</h1>
        <p className="mt-2 text-subheading font-light text-ash">
          {shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-body-sm text-ash">
          <span>by {instructorName}</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-500" aria-hidden="true">
            ★
          </span>
          <span className="font-medium text-graphite">
            {formatRating(rating)}
          </span>
          <span>({formatStudentCount(studentCount)} students)</span>
        </div>
      </div>

      {/* Media preview — plain <img> for now. A real video preview player is
          deferred until a later phase actually needs it (avoid over-engineering
          a video player before that's a concrete requirement). */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="aspect-video w-full rounded-card object-cover"
        />
      ) : (
        <div
          className="aspect-video w-full rounded-card bg-pebble"
          aria-hidden="true"
        />
      )}
    </header>
  );
}