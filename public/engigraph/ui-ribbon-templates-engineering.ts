/**
 * Engineering Design Tab Templates (Draw, Modelling, Annotate, Digitize)
 */
export const EngineeringTemplates = {
    renderDrawTab: () => `
        <div class="tool-section hidden" data-tab="draw">
            <div class="tool-group">
                <span class="toggle-label">Basic</span>
                <button class="tool-btn" data-tool="line" title="Precision Line"><i data-ribbon-icon="minus"></i><span>Line</span></button>
                <button class="tool-btn" data-tool="circle" title="Compass (Circle)"><i data-ribbon-icon="circle"></i><span>Compass</span></button>
                <button class="tool-btn" data-tool="ellipse" title="Ellipse"><i data-ribbon-icon="aperture"></i><span>Ellipse</span></button>
                <button class="tool-btn" data-tool="arc" title="Arc"><i data-ribbon-icon="refresh-cw"></i><span>Arc</span></button>
                <button class="tool-btn" data-tool="rect" title="Rectangle"><i data-ribbon-icon="square"></i><span>Rect</span></button>
                <button class="tool-btn" data-tool="rounded_rect" title="Fillet Rectangle"><i data-ribbon-icon="layout"></i><span>Round Rect</span></button>
                <button class="tool-btn" data-tool="polygon" title="Polygon (Hexagon)"><i data-ribbon-icon="hexagon"></i><span>Polygon</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Instruments</span>
                <button class="tool-btn" data-tool="ruler" title="Scale Ruler Guide"><i data-ribbon-icon="ruler"></i><span>Ruler</span></button>
                <button class="tool-btn" data-tool="drafter" title="Drafting Machine Head"><i data-ribbon-icon="compass"></i><span>Drafter</span></button>
                <button class="tool-btn" data-tool="set-square-30" title="30/60 Degree Set Square"><i data-ribbon-icon="triangle"></i><span>30/60°</span></button>
                <button class="tool-btn" data-tool="set-square-45" title="45 Degree Set Square"><i data-ribbon-icon="triangle"></i><span>45°</span></button>
                <button class="tool-btn" data-tool="protractor" title="360° Precision Protractor"><i data-ribbon-icon="circle-slash"></i><span>Protractor</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Sets</span>
                <button class="tool-btn" data-tool="set-paired-30" title="T-Square + 30/60° Set"><i data-ribbon-icon="layers"></i><span>30° Set</span></button>
                <button class="tool-btn" data-tool="set-paired-45" title="T-Square + 45° Set"><i data-ribbon-icon="layers"></i><span>45° Set</span></button>
                <button class="tool-btn" data-tool="set-paired-drafter" title="Drafter + Set Square"><i data-ribbon-icon="compass"></i><span>Drafter Set</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Refine</span>
                <button class="tool-btn" data-tool="bisect" title="Geometric Bisector"><i data-ribbon-icon="split"></i><span>Bisect</span></button>
                <button class="tool-btn" data-tool="fillet" title="Fillet / Round"><i data-ribbon-icon="corner-down-right"></i><span>Fillet</span></button>
                <button class="tool-btn" data-tool="spline" title="Freehand Sketch"><i data-ribbon-icon="pen-tool"></i><span>Sketch</span></button>
                <button class="tool-btn" data-tool="gear" title="Precision Involute Gear"><i data-ribbon-icon="settings"></i><span>Gear</span></button>
            </div>
        </div>
    `,

    renderModellingTab: () => `
        <div class="tool-section hidden" data-tab="modelling">
            <div class="tool-group">
                <span class="toggle-label">Precision CAD</span>
                <button class="tool-btn" data-tool="trim" title="Trim to Intersection"><i data-ribbon-icon="split"></i><span>Trim</span></button>
                <button class="tool-btn" data-tool="extend" title="Extend to Boundary"><i data-ribbon-icon="maximize"></i><span>Extend</span></button>
                <button class="tool-btn" data-tool="offset" title="Offset Curve"><i data-ribbon-icon="copy"></i><span>Offset</span></button>
                <button class="tool-btn" data-tool="mirror" title="Mirror Selection"><i data-ribbon-icon="columns"></i><span>Mirror</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Patterns</span>
                <button class="tool-btn" data-tool="array-linear" title="Linear Array Pattern"><i data-ribbon-icon="layout-grid"></i><span>Linear</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <span class="toggle-label">Hybrid Ops</span>
                <button class="tool-btn" id="btn-gen-enclosure" title="Generate Parametric Enclosure"><i data-ribbon-icon="box"></i><span>Mount Gen</span></button>
                <button class="tool-btn" data-tool="subdivide" title="Subdivide (Add Detail)"><i data-ribbon-icon="git-merge"></i><span>Divide</span></button>
                <button class="tool-btn" data-tool="sculpt" title="Soft Transform"><i data-ribbon-icon="waves"></i><span>Sculpt</span></button>
            </div>
        </div>
    `,

    renderAnnotateTab: () => `
        <div class="tool-section hidden" data-tab="annotate">
            <div class="tool-group">
                <button class="tool-btn" data-tool="dim-linear" title="Linear Dimension"><i data-ribbon-icon="ruler"></i><span>Linear</span></button>
                <button class="tool-btn" data-tool="dim-radial" title="Radial Dimension"><i data-ribbon-icon="radius"></i><span>Radial</span></button>
                <button class="tool-btn" data-tool="dim-smart" title="AI Auto-Dim"><i data-ribbon-icon="sparkles"></i><span>Auto Dim</span></button>
            </div>
            <div class="tool-separator"></div>
            <div class="tool-group">
                <button class="tool-btn" data-tool="text" title="Text Note"><i data-ribbon-icon="type"></i><span>Text</span></button>
                <button class="tool-btn" data-tool="leader" title="Leader Annotation"><i data-ribbon-icon="corner-down-right"></i><span>Leader</span></button>
            </div>
        </div>
    `,

    renderDigitizeTab: () => `
        <div class="tool-section hidden" data-tab="digitize">
            <div class="tool-group">
                <button class="tool-btn" id="btn-import-digitize" title="Import Scan"><i data-ribbon-icon="upload"></i><span>Import</span></button>
                <button class="tool-btn" id="btn-ai-refine" title="AI Geometry Rectification"><i data-ribbon-icon="sparkles"></i><span>Refine</span></button>
            </div>
        </div>
    `
};