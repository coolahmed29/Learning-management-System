/**
 * MSW server lifecycle — beforeAll/afterEach/afterAll hooks that run for every
 * test file automatically (imported via setup.js).
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
