# TelephonePole

A community bulletin board where anyone can post event flyers and browse them — like a telephone pole covered in stapled posters.

**Stack:** React + Vite (TypeScript) · Node.js + Express (TypeScript) · MongoDB

## Testing

Integration tests cover the Express API routes using Vitest, Supertest, and mongodb-memory-server.

Supertest runs HTTP requests against the Express app in-process — no server port needed, no test environment to manage. mongodb-memory-server spins up a real MongoDB instance for each test run rather than mocking Mongoose, so the actual query logic (cursor pagination, field projections, filter operators) is exercised. Mocking at the model layer would let tests pass while hiding bugs in the query itself — the field name mismatch between the upload form and the multer middleware (`"file"` vs `"image"`) is an example of a bug that only surfaces when the full request path runs.

Tests are colocated next to source files and can be run with `npm test` from the `server/` directory.
