/**
 * The single most important interactive element on the Course Details page — its
 * behavior branches on THREE distinct states: guest, authenticated-not-enrolled,
 * authenticated-enrolled. Owns the actual "Enroll" action (a mutation) in
 * addition to displaying status.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button/Button";
import { useAuth } from "../../auth/hooks/useAuth";
import { useEnrollmentStatus } from "../hooks/useEnrollmentStatus";
import { useEnrollCourse } from "../hooks/useEnrollCourse";

export function EnrollmentCTA({ courseId }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isEnrolled, progressPercent, isLoading: enrollmentLoading } =
    useEnrollmentStatus(courseId);
  const { mutate: enroll, isPending: isEnrolling } = useEnrollCourse();

  // While enrollment status loads, show a disabled placeholder so we never
  // flash "Enroll Now" then swap it for "Continue Learning" a moment later.
  if (enrollmentLoading) {
    return (
      <Button fullWidth disabled isLoading>
        Enroll Now
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        fullWidth
        onClick={() =>
          navigate("/login", { state: { redirectTo: `/courses/${courseId}` } })
        }
      >
        Enroll Now
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button fullWidth onClick={() => navigate(`/learn/${courseId}`)}>
        Continue Learning ({progressPercent}%)
      </Button>
    );
  }

  return (
    <Button fullWidth onClick={() => enroll(courseId)} isLoading={isEnrolling}>
      Enroll Now
    </Button>
  );
}