/**
 * Custom app-level error classes. Thrown by hook layers so page components can
 * branch on the failure *type* (e.g. a missing course vs a transient server
 * error) instead of matching on string messages.
 */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}