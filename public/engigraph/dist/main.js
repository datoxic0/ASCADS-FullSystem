"use strict";
const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "EngiGraph Pro",
        icon: path.join(__dirname, 'EngiGraphLogo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Necessary for local file imports in ES modules if protocol isn't complex
        }
    });
    win.maximize();
    win.setMenu(null); // Remove default menu for a professional look
    // Handle local file ESM serving
    win.loadFile('index.html');
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3RCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXpCLFNBQVMsWUFBWTtJQUNuQixNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQWEsQ0FBQztRQUM1QixLQUFLLEVBQUUsSUFBSTtRQUNYLE1BQU0sRUFBRSxHQUFHO1FBQ1gsS0FBSyxFQUFFLGVBQWU7UUFDdEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDO1FBQy9DLGNBQWMsRUFBRTtZQUNkLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsV0FBVyxFQUFFLEtBQUssQ0FBQywyRUFBMkU7U0FDL0Y7S0FDRixDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDZixHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsOENBQThDO0lBRWpFLGdDQUFnQztJQUNoQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRCxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtJQUN4QixZQUFZLEVBQUUsQ0FBQztJQUVmLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUN0QixJQUFJLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDL0MsWUFBWSxFQUFFLENBQUM7UUFDakIsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUMvQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDbEMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2IsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDIn0=