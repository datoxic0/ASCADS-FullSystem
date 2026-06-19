import paper from 'https://esm.sh/paper';

/**
 * Advanced State Management for Undo/Redo
 */
export class HistoryManager {
    constructor(app) {
        this.app = app;
        this.undoStack = [];
        this.redoStack = [];
        this.maxStates = 50;
        this.isApplying = false;
        
        // Initial state
        setTimeout(() => this.pushState(), 100);
    }

    /**
     * Snapshots the current project state (geometry & annotations)
     */
    pushState() {
        if (this.isApplying) return;
        
        if (this._pushTimer) clearTimeout(this._pushTimer);
        this._pushTimer = setTimeout(() => {
            const state = paper.project.layers
                .filter(l => l.name !== 'grid_layer' && l.visible)
                .map(l => {
                    // Temporarily hide handles to keep history clean and avoid ID-based crashes
                    const handles = l.getItems({ data: d => d && d.isHandle });
                    handles.forEach(h => h.visible = false);
                    
                    const layerJson = l.exportJSON({ precision: 4 });
                    
                    // Restore visibility for active selection
                    handles.forEach(h => { if(h.parent.selected) h.visible = true; });
                    
                    return { name: l.name, json: layerJson };
                });
            
            const serialized = JSON.stringify(state);
            
            // Efficiency check: Don't push identical states
            if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === serialized) return;

            this.undoStack.push(serialized);
            
            // Prevent memory bloat on very large projects
            if (this.undoStack.length > this.maxStates) {
                this.undoStack.shift();
            }
            
            this.redoStack = [];
            
            // Persist to local storage for crash recovery
            try {
                localStorage.setItem('engigraph_autosave', serialized);
            } catch (e) {
                console.warn("Storage quota exceeded. Autosave disabled for this session.");
            }
        }, 50);
    }

    undo() {
        if (this.undoStack.length <= 1) {
            this.app.ai.logAI("System", "No further undo history available.");
            return;
        }
        
        const currentState = this.undoStack.pop();
        // Update storage immediately on undo/redo to maintain state
        const lastValid = this.undoStack[this.undoStack.length - 1];
        if (lastValid) localStorage.setItem('engigraph_autosave', lastValid);

        this.redoStack.push(currentState);
        
        const prevState = this.undoStack[this.undoStack.length - 1];
        this.applyState(prevState);
        this.app.ai.logAI("System", "Undo performed.");
    }

    redo() {
        if (this.redoStack.length === 0) {
            this.app.ai.logAI("System", "Nothing to redo.");
            return;
        }
        
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.applyState(state);
        this.app.ai.logAI("System", "Redo performed.");
    }

    /**
     * Restores layers from a serialized JSON state
     */
    applyState(stateStr) {
        this.isApplying = true;
        const state = JSON.parse(stateStr);
        
        paper.project.deselectAll();
        
        // Remove existing dynamic layers that aren't in the state
        const stateLayerNames = state.map(s => s.name);
        paper.project.layers.forEach(l => {
            if (l.name !== 'grid_layer' && !stateLayerNames.includes(l.name)) {
                l.remove();
            }
        });

        state.forEach(layerState => {
            let layer = paper.project.layers.find(l => l.name === layerState.name);
            if (!layer) {
                layer = new paper.Layer({ name: layerState.name });
            }
            layer.removeChildren();
            layer.importJSON(layerState.json);
        });
        
        // Ensure standard UI updates
        this.app.ui.layers.updateLayerUI();
        this.app.ui.properties.updateProperties(null);
        if (this.app.circuit) this.app.circuit.needsDiscovery = true;
        this.isApplying = false;
        paper.view.update();
    }
}