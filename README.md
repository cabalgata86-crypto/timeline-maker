# Timeline Maker — Ready-to-build project

This archive contains a ready-to-build Electron + React (Vite) project that implements:
- A Word-like editor (rich text via contentEditable)
- Scalable timeline with events (date -> position)
- Resizable images (basic)
- Templates (personal/project)
- Autosave to localStorage
- Export: PNG (DPI), PDF, DOCX

## How to build and run locally (Windows)

1. Install Node.js (LTS) on your PC: https://nodejs.org/
2. Unzip this project folder.
3. Open a terminal inside the project folder and run:
   ```bash
   npm install
   npm run build-frontend
   npm run dist
   ```
4. After `npm run dist` completes, the Windows installer (`.exe` or an `nsis` installer) will be in the `dist` folder.

Notes:
- Building the installer requires `electron-builder` (already included in devDependencies).
- If you only want to test the app without building the installer:
  ```bash
  npm install
  npm run dev
  ```
  This runs the Vite dev server and Electron together (dev dependencies required).

## Automated build (GitHub Actions)
A GitHub Actions workflow file is included in `.github/workflows/build.yml` (recommended).
If you push this repo to GitHub and enable Actions, it will create Windows artifacts (.exe) automatically.

## Limitations & Tips
- Signed installers require a code signing certificate (not provided). Unsigned installers may trigger SmartScreen warnings on Windows.
- For images loaded from remote hosts, CORS policies might limit canvas export. Prefer local or data-URL images.
- For very large DPI (4x+) or very wide timelines, builds may require more RAM.

If you'd like, I can:
- Provide the ZIP for direct download.
- Prepare the GitHub repo and enable Actions to produce the .exe for you (requires you to push or give me permission to push).
- Build the Windows installer here — note I cannot run npm/electron-builder inside this chat environment to produce an .exe. I will, however, give you the ZIP and complete instructions and the GitHub Actions workflow so you can easily get a downloaded .exe without needing to install anything locally (GitHub will do the build).

