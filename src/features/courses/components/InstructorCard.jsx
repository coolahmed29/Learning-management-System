/**
 * Instructor bio block within Course Details — avatar, name, bio, and an
 * optional "X courses taught" stat line, composed on a Card.
 */
import { Card } from "../../../components/ui/Card/Card";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function InstructorCard({ instructor }) {
  if (!instructor) return null;

  const { name, bio, avatarUrl, coursesCount } = instructor;

  return (
    <Card className="flex items-start gap-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        // Initials-based placeholder when no avatar — candidate to promote to
        // components/ui/ if reused later (Navbar user menu, Profile page).
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-pebble text-subheading font-semibold text-graphite"
          aria-hidden="true"
        >
          {getInitials(name)}
        </div>
      )}

      <div>
        <h3 className="text-subheading font-semibold text-carbon">{name}</h3>
        {bio && <p className="mt-1 text-body-sm text-ash">{bio}</p>}
        {typeof coursesCount === "number" && (
          <p className="mt-2 text-caption text-ash">
            {coursesCount} {coursesCount === 1 ? "course" : "courses"} taught
          </p>
        )}
      </div>
    </Card>
  );
}