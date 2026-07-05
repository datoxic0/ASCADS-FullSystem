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
            }
            catch (e) {
                console.warn("Failed to restore session", e);
            }
        }
        // Hook into history manager for autosave
        const originalPushState = this.app.history.pushState.bind(this.app.history);
        this.app.history.pushState = () => {
            originalPushState();
            const state = this.app.history.undoStack[this.app.history.undoStack.length - 1];
            if (state)
                localStorage.setItem('engigraph_autosave', state);
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLXBlcnNpc3RlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZW5naW5lLXBlcnNpc3RlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBQ0gsTUFBTSxPQUFPLGtCQUFrQjtJQUMzQixZQUFZLEdBQUc7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsSUFBSTtRQUNBLDhCQUE4QjtRQUM5QixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDekQsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQztnQkFDRCxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNaLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO2dCQUM3RSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDWixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDTCxDQUFDO1FBRUQseUNBQXlDO1FBQ3pDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHLEVBQUU7WUFDOUIsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJLEtBQUs7Z0JBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUM7SUFDTixDQUFDO0NBQ0oifQ==