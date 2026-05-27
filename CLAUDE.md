# TelephonePole — Claude Instructions

## ESLint
Read the ESLint config before writing code in any package:
- Server: `server/eslint.config.mjs`
- Client: `client/eslint.config.js`

Both configs enforce `semi: ['error', 'always']` — every statement must end with a semicolon.

## Constants
Do not hardcode magic numbers or configuration values inline. Extract them to the appropriate constants file and import from there.

- Server constants: `server/constants.ts`

If a new constant file is needed for the client, create `client/src/constants.ts` following the same pattern.
