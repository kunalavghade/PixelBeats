# PixelBeats 🎮

PixelBeats is a client-side React + TypeScript web application that converts any MP4 video or audio file into a retro 8-bit chiptune masterpiece! Everything happens locally in your browser using WebAssembly and FFmpeg—no files are uploaded to any server.

## Features ✨
- **Retro Audio Filters**: Convert audio to NES, Game Boy, Atari, and Arcade styles using down-sampling and 8-bit quantization.
- **100% Client-Side**: Powered by `FFmpeg.wasm`. Privacy first; no backend required.
- **Waveform Visualizer**: Live audio visualization of both original and converted tracks.
- **Drag & Drop**: Modern drag-and-drop file upload.
- **Arcade Aesthetic**: Dark mode, CRT scanlines, and pixel fonts for that classic feel.

## Tech Stack 🛠️
- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- FFmpeg.wasm

## Local Development 🚀

1. **Clone the repository:**
   ```bash
   git clone git@github.com:kunalavghade/PixelBeats.git
   cd PixelBeats
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   > **Note**: This project relies on `SharedArrayBuffer`. The Vite dev server is configured with the correct `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers to support `FFmpeg.wasm`.

4. **Build for production:**
   ```bash
   npm run build
   ```

## CI/CD Flow & GitHub Pages Deployment 🌐

This project uses a fully automated GitHub Actions CI/CD pipeline.
- Whenever code is pushed to `main` or a Pull Request is opened against `main`, the CI workflow runs.
- The pipeline installs dependencies, lints the code, type-checks, and builds the bundle.
- On the `main` branch, a successful build is automatically deployed to **GitHub Pages**.

### GitHub Pages Setup
Since `FFmpeg.wasm` requires `SharedArrayBuffer`, which GitHub Pages doesn't support natively (due to missing cross-origin headers), this project implements a Service Worker (`coi-serviceworker.js`) workaround. This ensures that the page reloads with the correct headers injected locally inside the browser.

The base path for the app is `/PixelBeats/`.

## Deployment Instructions

To deploy your own version:
1. Ensure GitHub Actions are enabled in your repository settings.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set the **Source** to **GitHub Actions**.
4. Push your changes to `main` and the Actions workflow will handle the rest!
