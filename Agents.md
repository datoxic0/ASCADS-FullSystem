# Project Rules & Customizations

This file establishes strict instructions for all AI Agents working within the `ASCAD-FullSystem` repository.

## 1. Dual-Repository Structure & Deployment
This project consists of two repositories that **MUST** both be updated sequentially when a task is completed:

- **Public Repository (`ASCADS-FullSystem`)**
  - **Path:** `artifacts/logic-lab`
  - **Role:** Drives the live Vercel deployment.
  - **Action:** cd into `artifacts/logic-lab`, stage changes (`git add .`), commit, and push here FIRST.

- **Private Repository (`ASCAD-FullSystem`)**
  - **Path:** Workspace root (`/`)
  - **Role:** Master backup of all artifacts and backend systems.
  - **Action:** cd to the root, stage the `artifacts/logic-lab` submodule update (`git add artifacts/logic-lab`) along with any other root changes, commit, and push SECOND.

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
