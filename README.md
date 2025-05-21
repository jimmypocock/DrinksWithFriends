# Drinks With Friends

A mobile app for playing drinking games with friends in private virtual rooms. Built with React Native and Expo.

> This Project is based on [Obytes starter](https://starter.obytes.com)

## Features

- Play popular drinking games in virtual rooms with friends
- Real-time multiplayer with WebSockets
- Multiple game types: King's Cup, Never Have I Ever, Liar's Dice
- Private room creation with invite codes
- Customizable avatars and settings
- Supports both iOS and Android

## Requirements

- [React Native dev environment ](https://reactnative.dev/docs/environment-setup)
- [Node.js LTS release](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall), required only for macOS or Linux users
- [Pnpm](https://pnpm.io/installation)
- [Cursor](https://www.cursor.com/) or [VS Code Editor](https://code.visualstudio.com/download) ⚠️ Make sure to install all recommended extension from `.vscode/extensions.json`

## 👋 Quick start

Clone the repo to your machine and install deps:

```sh
git clone https://github.com/user/repo-name

cd ./repo-name

pnpm install
```

Install server dependencies:

```sh
pnpm server:install
```

### Running the App

To run both the server and the app at the same time:

```sh
pnpm dev
```

Or run them separately:

```sh
# Start the WebSocket server
pnpm server

# Start the Expo app
pnpm start
```

To run the app on simulators:

```sh
# iOS
pnpm ios

# Android
pnpm android
```

## Project Structure

```
src/
├── api/           # API layer
├── app/           # Expo Router screens
├── components/    # UI components
├── lib/           # Utilities
│   ├── auth/      # Authentication
│   ├── hooks/     # React hooks
│   ├── i18n/      # Internationalization
│   ├── sockets/   # WebSocket functionality
│   └── stores/    # Zustand stores
└── translations/  # i18n JSON files

server/            # WebSocket server
```

## Architecture

### Mobile App

- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS)
- Expo Router for navigation
- Zustand for state management
- Socket.IO for real-time communication

### Server

- Node.js
- Express
- Socket.IO
- In-memory storage (for development)

## Development Plan

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the detailed development roadmap.

## Developer Tools

The app includes several debugging and development tools accessible from the Settings screen:

### Data Reset Tools

Located at the bottom of the Settings screen in the "Developer Tools" section:

#### Available Tools:

- **Inspect Current Data** - Displays all storage keys and current state of Zustand stores (logs to console)
- **Reset All App Data** - Clears all app data and returns to home screen
  - Clears MMKV storage
  - Resets Zustand stores
  - Navigates back to home screen
  - Includes confirmation dialog for safety

### Debug Information

The Developer Tools section also displays:

- Current game store state (room status)
- Current user store state (profile status)
- Real-time storage inspection

### Usage

1. Open the app and navigate to Settings
2. Scroll to the bottom to find "Developer Tools"
3. Use **Inspect Current Data** to see what data exists (check console logs)
4. Use **Reset All App Data** when you need to clear everything

### Server Reset

To reset server data separately:

```sh
# Reset server data via HTTP endpoint
pnpm server:reset

# Or reset directly via script
cd server && node reset-server.js
```

## Commands

See [CLAUDE.md](./CLAUDE.md) for a full list of available commands.

## 📖 Documentation

- [Rules and Conventions](https://starter.obytes.com/getting-started/rules-and-conventions/)
- [Project structure](https://starter.obytes.com/getting-started/project-structure)
- [Environment vars and config](https://starter.obytes.com/getting-started/environment-vars-config)
- [UI and Theming](https://starter.obytes.com/ui-and-theme/ui-theming)
- [Components](https://starter.obytes.com/ui-and-theme/components)
- [Forms](https://starter.obytes.com/ui-and-theme/Forms)
- [Data fetching](https://starter.obytes.com/guides/data-fetching)
