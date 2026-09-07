/**
 * The core visual unit of course discovery — thumbnail, title, instructor,
 * rating, difficulty badge, price/free indicator. Used in CourseGrid,
 * FeaturedCoursesSection (Landing), and RelatedCoursesSection (Course Details).
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "../../../components/ui/Card/Card";
import { Badge } from "../../../components/ui/Badge/Badge";
import { useTheme } from "../../../providers/ThemeProvider";
import {
  cardEntryVariants,
  cardEntryVariantsReduced,
  cardHoverVariants,
  cardHoverVariantsReduced,
  getMotionProps,
} from "../../../animations";

function formatRating(rating) {
  return rating != null ? rating.toFixed(1) : "N/A";
}

function formatStudentCount(count) {
  const n = Number(count);
  if (Number.isNaN(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function CourseCard({ course }) {
  const { prefersReducedMotion } = useTheme();
  const {
    id,
    title,
    thumbnailUrl,
    instructorName,
    rating,
    studentCount,
    difficulty,
    price,
    isFree,
  } = course;

  const entry = getMotionProps(
    cardEntryVariants,
    cardEntryVariantsReduced,
    prefersReducedMotion
  );
  const hover = getMotionProps(
    cardHoverVariants,
    cardHoverVariantsReduced,
    prefersReducedMotion
  );

  // Merge both variant sets — keys don't collide (hidden/visible vs rest/hover).
  const variants = { ...entry, ...hover };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card padding="none" className="h-full overflow-hidden">
        <Link to={`/courses/${id}`} className="block">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div
              className="aspect-video w-full bg-pebble"
              aria-hidden="true"
            />
          )}

          <div className="p-card-padding">
            {difficulty && <Badge variant="info">{difficulty}</Badge>}

            <h3 className="mt-2 text-subheading font-semibold text-carbon">
              {title}
            </h3>
            <p className="mt-1 text-body-sm text-ash">{instructorName}</p>

            <div className="mt-2 flex items-center gap-1.5 text-caption text-ash">
              <span className="text-amber-500" aria-hidden="true">
                ★
              </span>
              <span className="font-medium text-graphite">
                {formatRating(rating)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatStudentCount(studentCount)} students</span>
            </div>

            <div className="mt-3">
              {isFree ? (
                <Badge variant="success">Free</Badge>
              ) : (
                <span className="text-body-sm font-semibold text-carbon">
                  ${Number(price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}