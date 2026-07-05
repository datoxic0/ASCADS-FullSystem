# EngiGraph Pro: High-Performance Build & Deployment Knowledge Base

This document serves as the official technical record of the build evolution for the EngiGraph Pro engineering suite, documenting transition from web-only to a high-performance, ultra-lightweight Windows binary.

## 1. Core Architecture Evolution
EngiGraph Pro began as a pure web application (HTML/JavaScript) utilizing the Paper.js engine. The deployment goal was to "wrap" this experience into a native Windows executable without sacrificing performance or increasing disk bloat.

### Deployment Targets
*   **Electron (Legacy/Backup)**: Uses a full Chromium instance. Resulted in ~150MB binaries. High compatibility but high bloat.
*   **Tauri (Current/Premium)**: Uses the system's native WebView2 (Edge) and a Rust backend. Resulted in a **2.1MB** installer. Maximum performance and zero bloat.

---

## 2. Technical Failures & Resolutions

### Failure A: Icon Namespace Collision
*   **Symptom**: The application would crash silently on boot with "Icon not found" errors in the console.
*   **Cause**: Multiple UI modules (Ribbon, Sidebar, AI) were competing for the standard `data-lucide` attribute, causing the JS engine to halt execution before listeners (like Layer Management) could be attached.
*   **Solution**: **Namespace Isolation**.
    *   Layout-level icons: `data-app-icon`
    *   Ribbon icons: `data-ribbon-icon`
    *   AI icons: `data-ai-icon`
    *   Layer icons: `data-layer-icon`
*   **Result**: 100% UI stability across all modules.

### Failure B: Windows Path Resolution (Parentheses & Spaces)
*   **Symptom**: Automated Batch scripts (`.bat`) would crash or exit immediately upon launch.
*   **Cause**: The project folder name `... (Latest1)` contained spaces and parentheses. Standard CMD `IF/ELSE` blocks fail to parse these paths correctly without advanced escaping.
*   **Solution**: **Linear Logic Migration**. Moved away from nested `IF` blocks to a `GOTO` label structure, which is immune to path-parsing failures in Batch.

### Failure C: Tauri `distDir` Recursion & Errors
*   **Symptom**: `npx tauri build` reported errors locating the frontend directory.
*   **Cause**: Attempting to set `distDir` to the project root (`..`) while the build tools themselves were located in a subdirectory (`src-tauri`). This caused recursive scanning and path resolution loops.
*   **Solution**: **Isolated Staging Area**. Created a `web_build` folder to host only the final production assets, clean of `node_modules` or Rust source code.

### Failure D: Mandatory Windows Icon Requirements
*   **Symptom**: Rust compiler error: `` `icons/icon.ico` not found; required for Windows Resource file ``.
*   **Cause**: Windows executables require an `.ico` format for the shell, but only a `.png` was provided.
*   **Secondary Failure**: `npx tauri icon` failed with "Invalid PNG Signature."
*   **Root Cause**: The provided `EngiGraphLogo.png` was actually a **JPEG** masquerading as a PNG.
*   **Final Solution**: Force-converted the JPEG to a multi-format ICO and PNG set using the `tauri icon` CLI with explicit format fallback.

---

## 3. The "One-Click" Build Pipeline (`build_win_exe.bat`)

A specialized, path-safe build automation script was created to handle the entire lifecycle:
1.  **Environment Check**: Verifies `node`, `npm`, and `rustc`.
2.  **Asset Staging**: Automatically synchronizes `.html`, `.js`, `.css`, and `.png` files into the `web_build` directory.
3.  **Choice Matrix**: Allows the user to select between **Tauri (Premium)** or **Electron (Fallback)**.
4.  **Native Compilation**: Invokes the Rust compiler and WiX Toolset to produce the final `.msi` and `.exe` installers.

---

## 4. Key Takeaways for Future Builds
1.  **Always use a Staging Folder**: Bundling the project root is risky; a dedicated `dist` or `web_build` folder prevents environment leakage.
2.  **Sanitize Binary Assets**: Ensure logos are actual PNGs with alpha channels to avoid "Invalid Signature" errors during bundling.
3.  **Namespace your HTML Attributes**: Avoid generic attributes like `data-lucide` in large modular apps; scope them to the module (e.g., `data-module-icon`).

---

## 5. Universal Hybrid Builder (`build_master.bat`)
The build system has been evolved into a **Universal Builder** to support the mobile-first future:
1.  **Uniform Staging**: All targets (Tauri, Electron, Capacitor) now pull from a synchronized `web_build` directory.
2.  **Cross-Platform Sync**: Integrated Capacitor for Android APK scaffolding (requires manual build in Android Studio due to Node v24 environment constraints).
3.  **PWA Optimization**: Service Worker (`sw.js`) has been upgraded to cache the full simulation suite (Flow, Acoustic, Noise) for native-like offline performance.

---

**Status**: Hybrid Builder Architecture Deployed. PWA/EXE synchronization verified. Ready for mobile UI refinement.
**Project Version**: 1.1.0
**Lead Engineer**: Antigravity AI
**Developer**: Siyabonga B Phakathi
