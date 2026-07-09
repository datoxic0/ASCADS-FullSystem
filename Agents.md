# Project Rules & Customizations

This file establishes strict instructions for all AI Agents working within the `ASCAD-FullSystem` repository.

## 1. Multi-Repository Structure & Deployment
This project consists of three repositories that **MUST** be updated sequentially when a task is completed. **CRITICAL WARNING: NEVER run `git commit` without first running `git add .` to ensure ALL files are staged.**

- **Public Repository (`ASCADS-FullSystem`)**
  - **URL:** `https://github.com/datoxic0/ASCADS-FullSystem`
  - **Live Deployment:** `https://ascads-full-system.vercel.app/`
  - **Path:** `artifacts/logic-lab`
  - **Role:** Drives the live Vercel deployment.
  - **Action:** `cd` into `artifacts/logic-lab`, stage ALL changes (**`git add .`** is mandatory), commit, and push here FIRST.

- **Private Repository (`ASCAD-FullSystem`)**
  - **URL:** `https://github.com/datoxic0/ASCAD-FullSystem`
  - **Path:** Workspace root (`/`)
  - **Role:** Master backup of all artifacts and backend systems.
  - **Action:** `cd` to the root, stage the `artifacts/logic-lab` submodule update along with any other root changes (**`git add .`**), commit, and push SECOND.

- **Replit Repository (`Advanced-Schematic-Design-1`)**
  - **URL:** `https://github.com/datoxic0/Advanced-Schematic-Design-1`
  - **Live App:** `https://advanced-schematic-design-1--datoxic0.replit.app/`
  - **Role:** The Replit deployment and environment where the project began. Structure mirrors the root.
  - **Action:** Changes must be synced to this repository to keep the Replit deployment up-to-date and maintain this backup platform.

- **Lovable Repository (`volt-logic-fusion` - Lovable)**
  - **URL:** `https://github.com/datoxic0/volt-logic-fusion`
  - **Role:** The Lovable platform deployment. Serves as a tertiary live hosting backup using the exact same system codebase.
  - **Action:** Sync the latest frontend/system codebase into this repository and push to keep the Lovable deployment identical to Vercel and Replit.

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
