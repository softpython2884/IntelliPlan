# IntelliPlan 📝

IntelliPlan is a modern, web-based 2D floor plan design tool built with Next.js and Firebase Studio. It empowers users to create detailed and accurate floor plans, arrange furniture, map out electrical circuits, and leverage AI-powered suggestions to optimize their space intelligently.

## ✨ Features

- **Interactive 2D Canvas:** An infinite, zoomable, and pannable canvas to design your space without limits.
- **Custom Room Drawing:** Easily draw polygonal rooms of any shape and size.
- **Rich Object Library:** Add and manipulate various items:
    - Furniture (rectangles, circles, etc.)
    - Electrical components (switches, outlets, ceiling lights)
    - Annotations and notes.
- **Precise Scaling:** Set a real-world scale for your entire plan by defining the length of a single reference line (e.g., a door or wall).
- **Advanced Layer Management:** A dynamic layers panel allows you to:
    - View all items in your project.
    - Reorder items to manage their superposition (z-index).
    - Toggle the visibility of individual items.
- **Electrical Circuit Planning:** Draw dedicated wiring paths to visualize and plan your electrical layouts.
- **Project Portability:**
    - **Export:** Save your entire project, including all items and the background image, to a JSON file.
    - **Import:** Load projects from a JSON file. A built-in migrator ensures backward compatibility with older project file versions.
    - **Image Overlay:** Import an existing floor plan image as a background to trace over.
- **AI Assistant (Powered by Genkit):**
    - **Layout Suggestions:** Get AI-driven furniture arrangement proposals based on your room dimensions and furniture list.
    - **Arrangement Evaluation:** Receive expert feedback on your current design's flow, aesthetics, and functionality.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN/UI](https://ui.shadcn.com/)
- **AI Integration:** [Genkit (via Firebase)](https://firebase.google.com/docs/genkit)
- **Development Environment:** [Firebase Studio](https://firebase.google.com/docs/studio)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (version 20 or later recommended)
- `pnpm` (or `npm`/`yarn`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. If using Genkit's AI features, you will need to add your API key:
    ```
    GEMINI_API_KEY=your_google_ai_api_key_here
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    This command runs the Next.js application, which will be accessible at [http://localhost:9002](http://localhost:9002).

2.  **Start the Genkit server (for AI features):**
    For the AI Assistant features to work, you need to run the Genkit development server in a separate terminal:
    ```bash
    pnpm genkit:dev
    ```

## 📜 Available Scripts

- `pnpm dev`: Starts the Next.js application in development mode.
- `pnpm genkit:dev`: Starts the Genkit development server.
- `pnpm build`: Creates a production build of the application.
- `pnpm start`: Starts the application in production mode (requires `build` to be run first).
- `pnpm lint`: Lints the codebase for errors and style issues.
- `pnpm typecheck`: Runs the TypeScript compiler to check for type errors.
