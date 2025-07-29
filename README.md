# Super Hexagon

A modern web-based recreation of the classic Super Hexagon game, built with cutting-edge web technologies. Navigate through an ever-rotating hexagonal maze while avoiding incoming walls in this fast-paced, challenging arcade game.

🎮 **[Play Now](https://albertsaniza.github.io/super-hexagon)**

![Super Hexagon](https://github.com/user-attachments/assets/9e5d5c09-9ad0-45c0-a3af-d0605dd48a41)

## About the Game

Super Hexagon is an intense, minimalist arcade game where you control a small triangle navigating through a rotating hexagonal maze. The objective is simple: survive as long as possible while walls close in from all directions. The game features:

- **Rotating perspective** that adds to the challenge and disorientation
- **Progressively increasing difficulty** with faster rotation and wall speeds
- **Score tracking** with local storage for personal best records
- **Smooth, responsive controls** using keyboard input
- **Minimalist visual design** with clean geometric shapes

## Technologies Used

- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[React](https://reactjs.org/)** - UI framework for the game interface
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Phaser.js](https://phaser.io/)** - Powerful 2D game framework for rendering and game logic
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for styling
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) (v18 or later)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/AlbertSanIza/super-hexagon.git
    cd super-hexagon
    ```

2. Install dependencies:

    ```bash
    bun install
    # or with npm
    npm install
    ```

3. Start the development server:

    ```bash
    bun run dev
    # or with npm
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build locally
- `bun run lint` - Run ESLint for code quality checks

## Game Controls

- **Left Arrow** or **A** - Rotate counter-clockwise
- **Right Arrow** or **D** - Rotate clockwise
- **Space** - Start game / Restart after game over

## Project Structure

```
src/
├── game/
│   ├── main.ts          # Game configuration and initialization
│   └── scenes/
│       ├── Game.ts      # Main game logic and mechanics
│       ├── Menu.ts      # Main menu and UI
│       └── Score.ts     # Score display and management
├── lib/
│   ├── event-bus.ts     # Event system for communication
│   └── score-storage.ts # Local storage utilities for scores
├── App.tsx              # Main React application component
├── Phaser.tsx           # Phaser game integration with React
└── main.tsx             # Application entry point
```

## Acknowledgments

- Inspired by the original [Super Hexagon](https://superhexagon.com/) by Terry Cavanagh
- Built as a learning project to explore modern web game development techniques
