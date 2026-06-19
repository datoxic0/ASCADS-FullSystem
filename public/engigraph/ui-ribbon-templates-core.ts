/**
 * Core Ribbon Tab Templates (Home, Output, Help)
 */
export const CoreTemplates = {
    renderHomeTab: () => `
        <div class="tool-section" data-tab="home">
            <div class="tool-group">
                <button class="tool-btn" id="btn-new-home" title="New Drawing"><i data-ribbon-icon="file-plus"></i><span>New</span></button>
                <button class="tool-btn tool-active" data-tool="select" title="Selection Tool"><i data-ribbon-icon="mouse-pointer-2"></i><span>Select</span></button>
                <button class="tool-btn" data-tool="pan" title="Pan Tool"><i data-ribbon-icon="move"></i><span>Pan</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <button class="tool-btn" id="btn-undo" title="Undo (Ctrl+Z)"><i data-ribbon-icon="undo-2"></i><span>Undo</span></button>
                <button class="tool-btn" id="btn-redo" title="Redo (Ctrl+Y)"><i data-ribbon-icon="redo-2"></i><span>Redo</span></button>
                <button class="tool-btn" id="btn-delete" title="Delete Selection (Del)"><i data-ribbon-icon="trash-2"></i><span>Delete</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <div class="scale-info">
                    <label>Annotation Scale:</label>
                    <select id="select-scale-home" class="pro-select">
                        <option value="1:1">1:1 (Full Size)</option>
                        <option value="1:2">1:2 (Half)</option>
                        <option value="1:5">1:5</option>
                        <option value="1:10">1:10</option>
                        <option value="2:1">2:1 (Double)</option>
                        <option value="5:1">5:1</option>
                    </select>
                </div>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <div class="iso-toggle-group">
                    <label class="toggle-label">Isometric Mode</label>
                    <div class="btn-switch">
                        <button class="small-tab-btn active" id="btn-iso-off">OFF</button>
                        <button class="small-tab-btn" id="btn-iso-on">ON</button>
                    </div>
                </div>
                <div id="isoplane-controls" class="hidden">
                    <label class="toggle-label">Plane</label>
                    <select id="select-isoplane" class="pro-select-sm">
                        <option value="top">Top</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <div class="color-picker-active">
                    <label class="toggle-label">Active Color</label>
                    <input type="color" id="active-color-picker" class="pro-input-color" value="#ffffff" title="Set Default Drawing Color">
                </div>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                 <button class="tool-btn" id="btn-zoom-extents" title="Zoom Extents"><i data-ribbon-icon="maximize-2"></i><span>Fit View</span></button>
            </div>
        </div>
    `,
    renderOutputTab: () => `
        <div class="tool-section hidden" data-tab="output">
            <div class="tool-group">
                <button class="tool-btn" id="btn-save-ribbon" title="Export High-Res SVG"><i data-ribbon-icon="download"></i><span>SVG</span></button>
                <button class="tool-btn" id="btn-download-project" title="Download Complete Project JSON"><i data-ribbon-icon="file-down"></i><span>Save Proj</span></button>
                <button class="tool-btn" id="btn-open-project" title="Open Project JSON"><i data-ribbon-icon="folder-open"></i><span>Open Proj</span></button>
                <button class="tool-btn" id="btn-print-ribbon" title="Print to Scale"><i data-ribbon-icon="printer"></i><span>Print</span></button>
                <button class="tool-btn" id="btn-gen-bom" title="Generate Bill of Materials"><i data-ribbon-icon="list"></i><span>BOM</span></button>
                <button class="tool-btn" id="btn-open-code" title="View Engineering Source"><i data-ribbon-icon="code"></i><span>Code/DX</span></button>
            </div>
        </div>
    `,
    renderHelpTab: () => `
        <div class="tool-section hidden" data-tab="help">
            <div class="tool-group">
                <button class="tool-btn" id="btn-open-thesis" title="System Thesis & Documentation">
                    <i data-ribbon-icon="book-open"></i><span>Thesis</span>
                </button>
                <button class="tool-btn" id="btn-open-tutorial" title="Interactive Tutorial">
                    <i data-ribbon-icon="graduation-cap"></i><span>Tutorial</span>
                </button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                 <button class="tool-btn" id="btn-standards-info" title="SANS 10111 Reference">
                    <i data-ribbon-icon="shield-check"></i><span>Standards</span>
                </button>
            </div>
        </div>
    `
};