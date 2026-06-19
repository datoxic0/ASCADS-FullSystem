/**
 * Manages session persistence and local storage synchronization.
 */
export class PersistenceManager {
    constructor(app) {
        this.app = app;
    }

    init() {
        // Load last session if exists
        const saved = localStorage.getItem('engigraph_autosave');
        if (saved) {
            try {
                setTimeout(() => {
                    this.app.history.applyState(saved);
                    this.app.ai.logAI("System", "Last session restored from local storage.");
                }, 500);
            } catch (e) {
                console.warn("Failed to restore session", e);
            }
        }

        // Hook into history manager for autosave
        const originalPushState = this.app.history.pushState.bind(this.app.history);
        this.app.history.pushState = () => {
            originalPushState();
            const state = this.app.history.undoStack[this.app.history.undoStack.length - 1];
            if (state) localStorage.setItem('engigraph_autosave', state);
        };
    }
}