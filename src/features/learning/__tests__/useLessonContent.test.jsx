/**
 * FILE: src/features/learning/__tests__/useLessonContent.test.js
 * PURPOSE: Hook unit test.
 *
 * TEST CASES:
 *    ✓ returns lesson content (video type) correctly on success
 *    ✓ returns lesson content (text type) correctly on success
 *    ✓ isError true on failed fetch
 *    ✓ does not fire when lessonId is undefined
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../../test/mocks/server";
import { useLessonContent } from "../hooks/useLessonContent";

const videoLesson = {
  id: "les-1",
  title: "Introduction to React",
  video_url: "https://cdn.example.com/intro.mp4",
  text_content: null,
  resources: [{ name: "Slides", url: "https://example.com/slides.pdf" }],
  module: { course_id: "course-1", title: "Getting Started" },
};

const textLesson = {
  id: "les-2",
  title: "React Fundamentals",
  video_url: null,
  text_content: "<p>React is a JavaScript library for building user interfaces.</p>",
  resources: [],
  module: { course_id: "course-1", title: "Getting Started" },
};

function renderLessonContent(lessonId) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useLessonContent(lessonId), { wrapper });
}

describe("useLessonContent", () => {
  it("returns lesson content (video type) correctly on success", async () => {
    server.use(
      http.get("*/rest/v1/lessons", () => HttpResponse.json(videoLesson))
    );

    const { result } = renderLessonContent("les-1");

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data.id).toBe("les-1");
    expect(result.current.data.title).toBe("Introduction to React");
    expect(result.current.data.video_url).toBe("https://cdn.example.com/intro.mp4");
    expect(result.current.data.text_content).toBeNull();
    expect(result.current.data.resources).toHaveLength(1);
    expect(result.current.data.module.course_id).toBe("course-1");
  });

  it("returns lesson content (text type) correctly on success", async () => {
    server.use(
      http.get("*/rest/v1/lessons", () => HttpResponse.json(textLesson))
    );

    const { result } = renderLessonContent("les-2");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data.id).toBe("les-2");
    expect(result.current.data.title).toBe("React Fundamentals");
    expect(result.current.data.video_url).toBeNull();
    expect(result.current.data.text_content).toBe(
      "<p>React is a JavaScript library for building user interfaces.</p>"
    );
    expect(result.current.data.resources).toHaveLength(0);
  });

  it("isError true on failed fetch", async () => {
    server.use(
      http.get("*/rest/v1/lessons", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderLessonContent("les-1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Failed to load lesson");
    expect(result.current.data).toBeUndefined();
  });

  it("does not fire when lessonId is undefined", async () => {
    const calls = [];
    server.use(
      http.get("*/rest/v1/lessons", () => {
        calls.push("lessons");
        return HttpResponse.json([videoLesson]);
      })
    );

    const { result } = renderLessonContent(undefined);

    await new Promise((r) => setTimeout(r, 50));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
