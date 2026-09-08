/**
 * Query hook for a single lesson's content (video_url or text_content, title,
 * resources) plus its module/course context for breadcrumbs — the data behind
 * the LearningPage's main reading-viewing pane.
 */
import { useQuery } from "@tanstack/react-query";
import * as learningApi from "../api/learningApi";

export function useLessonContent(lessonId) {
  return useQuery({
    queryKey: ["lessonContent", lessonId],
    queryFn: () =>
      learningApi.getLessonContent(lessonId).then(({ data, error }) => {
        if (error) throw new Error("Failed to load lesson");
        return data;
      }),
    // Guarded by lessonId: navigating between lessons creates a NEW query key,
    // but a still-empty id (initial route render) must not fire.
    enabled: !!lessonId,
  });
}