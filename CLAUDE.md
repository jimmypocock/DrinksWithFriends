# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development**

```bash
pnpm install                    # Install dependencies
pnpm start                      # Start Expo development server
pnpm ios                        # Run on iOS simulator
pnpm android                    # Run on Android emulator
pnpm web                        # Run web version
```

**Environment-specific builds**

```bash
pnpm start:staging              # Start with staging environment
pnpm start:production           # Start with production environment
pnpm build:development:ios      # Build development iOS
pnpm build:staging:android      # Build staging Android
```

**Code Quality**

```bash
pnpm lint                       # ESLint check
pnpm type-check                 # TypeScript check
pnpm lint:translations          # JSON translation lint
pnpm test                       # Run Jest tests
pnpm test:watch                 # Run tests in watch mode
pnpm check-all                  # Run all checks (lint + type-check + translations + test)
```

**Other**

```bash
pnpm doctor                     # Run expo-doctor
pnpm e2e-test                   # Run Maestro E2E tests
```

## Architecture

This is a React Native Expo app using TypeScript and file-based routing with Expo Router.

**Tech Stack**

- React Native 0.76.6 with Expo ~52.0.26
- TypeScript with strict typing
- NativeWind (Tailwind CSS for React Native)
- React Query + React Query Kit for data fetching
- Zustand for global state management
- i18next for internationalization

**Core Structure**

```
src/
├── api/           # API layer with React Query
├── app/           # Expo Router screens (file-based routing)
├── components/    # Shared components + UI primitives
├── lib/           # Utilities (auth, hooks, i18n, storage)
├── translations/  # i18n JSON files
└── types/         # Shared TypeScript types
```

**Key Patterns**

- Expo Router file-based navigation with typed routes enabled
- Environment-based configuration in `env.js` with staging/production variants
- API calls use React Query Kit pattern with custom hooks (`use-posts.ts`, `use-add-post.ts`)
- UI components use NativeWind styling with custom design system colors/fonts
- Global state via Zustand stores
- Auth state hydration on app start
- Theme system with dark/light mode support

**Environment System**

- Uses `APP_ENV` to switch between development/staging/production
- Environment variables validated with Zod schemas
- Bundle IDs and package names automatically suffixed for non-production builds
- Client vs build-time environment variable separation

**Provider Setup**
The app root wraps with essential providers:

- GestureHandlerRootView → KeyboardProvider → ThemeProvider → APIProvider → BottomSheetModalProvider

**Testing**

- Jest with React Native Testing Library
- Test files use `.test.tsx` extension
- Unit tests for utilities and complex components only

## Development Guidelines

**Device Setup**
- iOS and Android emulators are confirmed working
- Useful to test on both platforms simultaneously for consistency
- Press `j` in Metro terminal to open React Native DevTools for debugging

**Code Quality Workflow**
- Always run `pnpm check-all` before commits
- Type checking is strict - fix TypeScript errors immediately
- Follow existing component patterns and NativeWind styling
- Use existing UI components from `src/components/ui/` before creating new ones

**API Development**
- API calls follow React Query Kit pattern with custom hooks
- Add new endpoints to appropriate folders under `src/api/`
- Use TypeScript types for all API responses and requests
- Follow existing naming conventions: `use-{entity}.ts`, `use-{action}-{entity}.ts`

**Component Guidelines**
- Use NativeWind classes for styling (not inline styles)
- Check existing components for similar patterns before creating new ones
- Test components work on both iOS and Android
- Add unit tests for complex logic or reusable components

**Navigation**
- Uses Expo Router file-based routing - new screens go in `src/app/`
- Route parameters are typed - update types when adding new routes
- Use typed navigation helpers from Expo Router

**Internationalization**
- Add new strings to both `src/translations/en.json` and `src/translations/ar.json`
- Use i18n keys consistently across the app
- Run `pnpm lint:translations` to validate JSON syntax