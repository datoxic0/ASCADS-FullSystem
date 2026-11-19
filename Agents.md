# Project Rules & Customizations

This file establishes strict instructions for all AI Agents working within the `ASCAD-FullSystem` repository.

## 1. Multi-Repository Local Folder Structure & Deployment
This project operates across three distinct local directories on the Desktop, mapping to three remote platforms (Vercel, Replit, Lovable). Because external AI agents (like Lovable) may inject new code (Auth, Database) directly into their respective cloud repositories, **you MUST follow this strict sync protocol** to avoid destroying features:

- **Master Monorepo & Vercel (`ASCAD-FullSystem`)**
  - **Local Path:** `E:\Coding-and-Programming\ASCAD\Advanced-Schematic-Design-FullSystem-main`
  - **URL:** `https://github.com/datoxic0/ASCAD-FullSystem`

  - **Live App:** Vercel (`https://ascads-full-system.vercel.app/`)
  - **URL:** `https://github.com/datoxic0/ASCADS-FullSystem`

  - **Role:** The source of truth. All core logic and UI changes MUST be developed here.
  - **Action:** Changes are made in `artifacts/logic-lab`. Run `git commit` and `git push origin main` inside `logic-lab` to trigger Vercel. Run `git commit` and `git push origin main` at the root to update the master backup.

- **Lovable Repository (`volt-logic-fusion`)**
  - **Local Path:** `E:\Coding-and-Programming\ASCAD\volt-logic-fusion`
  - **URL:** `https://github.com/datoxic0/volt-logic-fusion`
  - **Live App:** Lovable (`https://volt-logic-fusion.lovable.app/`)
  - **Role:** Lovable frontend deployment. Lovable Cloud AI adds features (like Auth and Database) here.
  - **Action:** 
    1. ALWAYS run `git pull origin main` inside this local folder first to get cloud upgrades.
    2. Sync any new Lovable cloud features (e.g., Auth/Supabase) BACK into the Master Monorepo (`artifacts/logic-lab`).
    3. To deploy new UI changes, copy the updated `artifacts/logic-lab` codebase INTO this folder. BUT IMPORTANT: edits must first pass through the local folder before being added and committed. You must verify and push from the local folder ONLY AFTER it has been correctly updated without destroying Lovable-specific cloud integrations. All repos are different!

- **Replit Repository (`Advanced-Schematic-Design-1`)**
  - **Local Path:** `E:\Coding-and-Programming\ASCAD\Advanced-Schematic-Design-1`
  - **URL:** `https://github.com/datoxic0/Advanced-Schematic-Design-1`
  - **Live App:** Replit (`https://advanced-schematic-design-1--datoxic0.replit.app/`)
  - **Role:** The Replit backup deployment. Structure mirrors the root monorepo.
  - **Action:** 
    1. ALWAYS run `git pull origin main` inside this folder first.
    2. Sync the latest Master Monorepo files INTO this folder.
    3. Run `git add`, `commit`, and `push origin main` from inside `Advanced-Schematic-Design-1`.
  - **Difference:** Replit has restricted memory (OOM crashes) so NEVER run builds with `--max-old-space-size=4096`. Ensure `artifact.toml` points to `artifacts/logic-lab/dist`. Also, ensure that Replit-specific fixes (e.g., `watch.ignored` in Vite to prevent ENOSPC, and `.replit` explicit run commands) are preserved and not destroyed when syncing from Master! All repos are different!

## 2. Authentication & Identity Rules
The user relies on 7-day time-based access tokens for Git authentication.
- If you encounter a Git authentication error, **DO NOT** attempt to bypass it or run extensive credential manager hacks. Instead, politely ask the user for their latest 7-day token URL.
- Always configure the Git identity before pushing if it is not already set:
  ```bash
  git config --global user.name "Siyabonga Blessing Phakathi"
  git config --global user.email "datoxic0@gmail.com"
  ```

## 3. "Writing Better Code" Mandate
The user enforces extremely strict standards for codebase quality. You MUST adhere to the following constraints:
- **No Legacy Vanilla JS:** Never write massive `vanilla.js` patches, use raw DOM manipulation (e.g. `document.getElementById`), or create "legacy backup" scripts.
- **Idiomatic React/TS:** All UI and logic code must be written in modern React using strict TypeScript. Use proper React state management, hooks, and immutable patterns.
- **No Bloat:** Never create large backup files (like `backup.txt` or `legacy_reference` folders) in the source tree. If you need to backup something temporarily, use the agent scratch directory (`<appDataDir>/brain/<conversation-id>/scratch/`).
- **Aesthetics Matter:** This is an advanced engineering schematic tool. Ensure any new UI components follow the established premium design system (TailwindCSS, glassmorphism, precise alignment, responsive on mobile).
