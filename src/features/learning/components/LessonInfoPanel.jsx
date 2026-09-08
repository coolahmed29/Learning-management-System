/**
 * LessonInfoPanel — the lesson's title, description, and downloadable resource
 * links, shown alongside/below the LessonContentPanel in the Learning Interface.
 * Resource urls are Supabase Storage public URLs, opened in a new tab.
 */
export function LessonInfoPanel({ lesson }) {
  const description = lesson.description;
  const resources = Array.isArray(lesson.resources) ? lesson.resources : [];

  return (
    <section>
      <h2 className="text-heading-sm font-semibold text-carbon">{lesson.title}</h2>

      {description && <p className="mt-2 text-body text-ash">{description}</p>}

      {resources.length > 0 && (
        <div className="mt-4">
          <h3 className="text-body font-semibold text-carbon">Resources</h3>
          <ul className="mt-2 space-y-1">
            {resources.map((resource, index) => (
              <li key={resource.name ?? resource.url ?? index}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-body-sm text-link-blue underline underline-offset-2 hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
                >
                  {resource.name ?? resource.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}