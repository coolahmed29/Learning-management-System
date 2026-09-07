/**
 * 404 Not Found page.
 */
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-display font-bold text-carbon">404</p>
      <h1 className="text-heading font-semibold text-carbon">Page not found</h1>
      <p className="max-w-md text-body text-ash">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button variant="filled" size="md" onClick={() => {}}>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
