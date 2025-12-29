# Useful Commands for Short-Tube Development

## Development
- `npm run dev` - Start both server and web dev servers concurrently
- `npm run server:dev` - Start Express server with nodemon (TypeScript auto-reload)
- `npm run web:dev` - Start React dev server

## Building
- `npm run build` - Build all workspaces (server TypeScript, web webpack)
- `npm run server:build` - Build server only (TypeScript compilation)
- `npm run web:build` - Build web app only
- `npm run types:build` - Build shared types package

## Running
- `npm run server:start` - Start built server from dist/
- `npm run web:start` - Start built web app
- `npm start` - Start all built workspaces

## Cleanup
- `npm run clean` - Remove dist/ and node_modules from all workspaces

## Git workflow
- `git status` - Check current branch and changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Create commit
- `git log -5` - View last 5 commits

## TypeScript Compilation
- The server uses TypeScript with strict mode enabled
- Target: ES2020, Module: CommonJS
- Output: dist/ directory (configured in apps/server/tsconfig.json)

## After implementing code changes
1. Run `npm run server:build` to check for TypeScript errors
2. Test the changes in dev environment
3. Run `npm run build` before committing to ensure all workspaces compile
