# Times Tables Voice Practice 🎯

A voice-enabled interactive web app for practicing multiplication times tables (0-12). Speak your answers and get instant feedback!

## ⚠️ Browser Requirements

**This app ONLY works in Chromium-based browsers** due to its dependency on the Web Speech Recognition API.

### ✅ Supported Browsers:
- Google Chrome (recommended)
- Microsoft Edge
- Brave Browser
- Opera
- Vivaldi
- Other Chromium-based browsers

### ❌ NOT Supported:
- **Firefox** - Mozilla has not implemented the Web Speech Recognition API and has no plans to add it
- **Safari** - Limited/no support for Web Speech Recognition
- Older browsers

> **Firefox users**: We wish Firefox was supported too! 🦊 Unfortunately, the Web Speech Recognition API is only available in Chromium browsers, and we cannot work around this limitation. You'll need to use Chrome, Edge, Brave, or another Chromium-based browser.

## Features

- 🎤 **Voice Recognition** - Speak your answers using your microphone
- 📊 **Performance Tracking** - Track accuracy, response times, and progress
- 👥 **Multi-User Support** - Create profiles for multiple learners
- 💾 **Saved Sets** - Name a selection of tables and reload it in one click
- 📈 **Session History** - Review past practice sessions and high scores (tracked per set of tables, so a 0-only run never outranks a full one)
- ⚡ **Speed Categories** - Get feedback on response speed (fast/medium/slow)
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works on desktop and mobile (with supported browser)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A **Chromium-based browser** (Chrome, Edge, Brave, etc.)
- A working microphone

### Installation

1. Clone the repository
2. Install dependencies:

```sh
npm install
```

3. Start the development server:

```sh
npm run dev

# or open in browser automatically
npm run dev -- --open
```

4. **Important**: Open the app in a supported browser (Chrome/Edge/Brave)

## Usage

1. **Select a user** or create a new profile
2. **Choose which times tables** to practice (0-12)
3. **Click "Start Practice"**
4. **Say your answers** when the microphone is listening
5. **Review your results** at the end of the session

## Development

### Available Scripts

```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run TypeScript/Svelte type checking
npm run check:watch  # Type checking in watch mode
npm test             # Run the unit tests
npm run test:watch   # Unit tests in watch mode
```

### Technology Stack

- **SvelteKit 2** - Full-stack framework
- **Svelte 5** - Component framework with reactive stores
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling (CSS-first config in `src/app.css`)
- **Vite 7** - Fast build tool
- **Vitest** - Unit tests for the scoring and speech-parsing logic
- **Web Speech API** - Browser voice recognition (Chromium only)

## Deployment

To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

```sh
npm run build
```

> **Note**: Make sure users are aware of the browser requirements when deploying!

## Contributing

Contributions welcome! Please note that we cannot add Firefox support due to the lack of Web Speech Recognition API in that browser.

## License

This project is private/educational.
