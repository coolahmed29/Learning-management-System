/**
 * LessonContentPanel — the main pane of the Learning Interface. Renders the
 * actual lesson media: a native HTML5 <video> for 'video' lessons, or the
 * written content for 'text' lessons. Content source (direct Supabase Storage
 * file URL vs YouTube/Vimeo embed) is finalized in Course Builder/Phase 9; for
 * now a direct file URL + native <video controls> is assumed, matching the spec.
 */
import { useState } from "react";

export function LessonContentPanel({ lesson }) {
  const contentType = lesson.contentType ?? lesson.content_type ?? "text";
  const videoUrl = lesson.videoUrl ?? lesson.video_url;
  const textContent = lesson.textContent ?? lesson.text_content;

  if (contentType === "video") {
    return videoUrl ? <VideoPlayer src={videoUrl} title={lesson.title} /> : <Fallback message="No video available for this lesson." />;
  }

  return textContent ? <TextContent text={textContent} /> : <Fallback message="No content available for this lesson." />;
}

/**
 * NOTE on 'text' rendering: no markdown renderer or DOMPurify is installed yet,
 * and the lesson-authoring source (Markdown vs WYSIWYG HTML) isn't finalized.
 * Until it is, text content is rendered as SAFE PLAIN TEXT — never raw
 * unsanitized HTML from the database, even if instructor-authored (defensive
 * security practice). Swap in a markdown renderer or a DOMPurify-sanitized
 * dangerouslySetInnerHTML when Phase 9 pins down the content format.
 */
function TextContent({ text }) {
  return (
    <div className="whitespace-pre-wrap text-body leading-relaxed text-carbon">
      {text}
    </div>
  );
}

function VideoPlayer({ src, title }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-card border border-mist/40 bg-frost px-6 py-10 text-center"
      >
        <p className="text-body-sm text-carbon">This video failed to load.</p>
        <button
          type="button"
          onClick={() => setHasError(false)}
          className="rounded-pill border border-link-blue px-4 py-1.5 text-body-sm text-link-blue hover:bg-link-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
        >
          Reload video
        </button>
      </div>
    );
  }

  // key={src} remounts the element cleanly when retrying after an error.
  return (
    <video
      key={src}
      controls
      src={src}
      aria-label={title ?? "Lesson video"}
      onError={() => setHasError(true)}
      className="aspect-video w-full rounded-card bg-ink/40"
    />
  );
}

function Fallback({ message }) {
  return (
    <div className="rounded-card border border-mist/40 bg-frost px-6 py-10 text-center text-body-sm text-ash">
      {message}
    </div>
  );
}