/**
 * Collapsible module/lesson tree for the Course Details page — shows the
 * curriculum structure, with lessons LOCKED (not playable) unless the user is
 * enrolled, except lessons explicitly marked as previews. Course data arrives
 * nested from Supabase (snake_case columns) while siblings sometimes describe
 * props in camelCase, so each accessor tolerates both.
 */
import { useMemo, useState } from "react";

function getDurationMinutes(lesson) {
  return lesson.duration_minutes ?? lesson.durationMinutes ?? 0;
}

function getIsPreview(lesson) {
  return Boolean(lesson.is_preview ?? lesson.isPreview);
}

function formatDuration(totalMinutes) {
  const minutes = Number(totalMinutes) || 0;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours} hr ${rem} min` : `${hours} hr`;
}

export function CourseCurriculumAccordion({ modules = [], isEnrolled = false }) {
  return (
    <section>
      <h2 className="text-heading-sm font-semibold text-carbon">Curriculum</h2>
      <div className="mt-4 space-y-3">
        {modules.map((module) => (
          <ModuleAccordionItem
            key={module.id}
            module={module}
            isEnrolled={isEnrolled}
          />
        ))}
      </div>
    </section>
  );
}

function ModuleAccordionItem({ module, isEnrolled }) {
  const [open, setOpen] = useState(false);

  // lesson count + total duration computed once per module, not on every render.
  const { lessonCount, totalDuration } = useMemo(() => {
    const lessons = module.lessons ?? [];
    return {
      lessonCount: lessons.length,
      totalDuration: lessons.reduce(
        (total, lesson) => total + getDurationMinutes(lesson),
        0
      ),
    };
  }, [module]);

  return (
    <div className="overflow-hidden rounded-card border border-mist/40 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
      >
        <span className="text-body font-semibold text-carbon">{module.title}</span>
        <span className="flex shrink-0 items-center gap-2.5 text-caption text-ash">
          <span>
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(totalDuration)}</span>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <ul className="border-t border-mist/40">
          {(module.lessons ?? []).map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              locked={!isEnrolled && !getIsPreview(lesson)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonRow({ lesson, locked }) {
  const isPreview = getIsPreview(lesson);

  return (
    <li
      aria-disabled={locked || undefined}
      className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
        locked ? "text-ash" : "text-carbon"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={locked ? "text-mist" : "text-link-blue"} aria-hidden="true">
          {locked ? <LockIcon /> : <PlayIcon />}
        </span>
        <span className="truncate text-body-sm">{lesson.title}</span>
      </span>

      <span className="flex shrink-0 items-center gap-2 text-caption text-ash">
        {isPreview && !locked && (
          <span className="rounded-pill bg-ice px-2 py-0.5 text-link-blue">
            Preview
          </span>
        )}
        {locked && (
          <span className="rounded-pill bg-frost px-2 py-0.5 text-mist">
            Locked
          </span>
        )}
        <span>{formatDuration(getDurationMinutes(lesson))}</span>
      </span>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M7 9V7a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v2z" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}