import { useEffect, useRef } from "react";
import { askAI } from '@/lib/ai';
import { UNIFIED_REGISTRY } from '@/lib/unified-components';

export default function EngigraphNative() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Expose central library for the Engigraph engine
    (window as any).ASCADComponentLibrary = UNIFIED_REGISTRY;

    // 1. AI Bridge (Polyfill for websim using Gemini)
    (window as any).websim = {
        chat: {
            completions: {
                create: async (req: any) => {
                    try {
                        const prompt = req.messages.map((m: any) => {
                            if (Array.isArray(m.content)) {
                                return m.content.map((c: any) => c.text || '').join('\\n');
                            }
                            return m.content || '';
                        }).join('\\n\\n');

                        if (!prompt) return { content: "No input provided." };

                        const response = await askAI(prompt, { source: 'engigraph' });
                        return { content: response };
                    } catch (e: any) {
                        console.error('AI Bridge Runtime Error:', e);
                        return { content: `AI Bridge Error: ${e.message}` };
                    }
                }
            }
        }
    };

    // 2. Math Parameter Bridge
    const updateMathParams = () => {
        try {
            const params = JSON.parse(localStorage.getItem('ascads_global_params') || '{}');
            (window as any).ASCAD_MathParams = params;
        } catch (e) {
            (window as any).ASCAD_MathParams = {};
        }
    };
    updateMathParams();
    window.addEventListener('storage', updateMathParams);
    
    // 3. Dynamically load CSS to prevent global bleeding
    const cssFiles = [
      'style-base.css', 'style-ribbon.css', 'style-sidebar.css',
      'style-canvas.css', 'style-modals.css', 'style-status.css',
      'style-responsive.css', 'style.css'
    ];
    
    const styleLinks: HTMLLinkElement[] = [];
    cssFiles.forEach(file => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/engigraph/${file}`;
      link.dataset.engigraph = 'true';
      document.head.appendChild(link);
      styleLinks.push(link);
    });

    // 4. Inject the main script dynamically
    const scriptId = "engigraph-main-script";
    let script: HTMLScriptElement | null = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.src = "/engigraph/dist/app.js";
      document.body.appendChild(script);
    }

    return () => {
      styleLinks.forEach(link => link.remove());
      window.removeEventListener('storage', updateMathParams);
      // Clean up background engine loops to prevent DOM errors
      if (typeof window !== 'undefined' && (window as any).app) {
          if ((window as any).app.circuit) (window as any).app.circuit.stop();
          if ((window as any).app.ai) (window as any).app.ai.toggleRealtimeLinter(false);
      }
      // we leave the script to avoid re-evaluating 80 files and causing conflicts
    };
  }, []);

  useEffect(() => {
    // Basic cleanup logic if needed for external components
    // App.js handles the terminal/command bar internally via tool-commands.ts
    
    return () => {
       // any needed cleanup
    };
  }, []);

  return (
    <div className="engigraph-root" ref={containerRef}>
      {/* Loading State */}
      <div id="loading-overlay" style={{ display: 'none' }}>
          <div className="loader-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src="/engigraph/EngiGraphLogo.png" alt="EngiGraph Pro Logo" style={{ width: '120px', height: '120px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 32px rgba(0, 242, 255, 0.3)', border: '2px solid rgba(255,255,255,0.1)' }} />
              <div className="loader-spinner"></div>
              <p id="loader-text">Initializing Engineering Engine...</p>
          </div>
      </div>

      <div id="app" className="hidden" style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}>
          {/* Top Ribbon Menu */}
          <header className="ribbon" id="ribbon-container">
              <div className="ribbon-tabs" id="ribbon-tabs-container"></div>
              <div className="ribbon-content" id="ribbon-content-container"></div>
              <div className="ribbon-actions">
                  <button className="action-toggle" id="btn-theme-toggle" title="Toggle Light/Dark Mode">
                      <i data-app-icon="sun" id="theme-icon-light" className="hidden"></i>
                      <i data-app-icon="moon" id="theme-icon-dark"></i>
                  </button>
              </div>
          </header>

          <main className="workspace">
              {/* Oscilloscope / Waveform Panel */}
              <div id="oscilloscope-panel" className="floating-panel hidden">
                  <header>
                      <span><i data-app-icon="activity"></i> Logic Analyzer / Oscilloscope</span>
                      <button id="btn-close-scope">&times;</button>
                  </header>
                  <div className="scope-body">
                      <canvas id="scope-canvas"></canvas>
                  </div>
                  <footer>
                      <span id="scope-status">Probing Net: None</span>
                  </footer>
              </div>

              {/* Virtual Serial Terminal */}
              <div id="terminal-panel" className="floating-panel terminal hidden">
                  <header>
                      <span><i data-app-icon="terminal"></i> Virtual Serial Monitor (9600 baud)</span>
                      <button id="btn-close-terminal">&times;</button>
                  </header>
                  <div className="terminal-body" id="terminal-log">
                      <div className="term-line system">&gt; EngiGraph Virtual Console Initialized...</div>
                  </div>
                  <footer>
                      <div className="term-input-row">
                          <input type="text" id="term-input" placeholder="Send command to MCU..." />
                          <button id="btn-term-clear">Clear</button>
                      </div>
                  </footer>
              </div>

              <div id="mobile-sidebar-toggle" className="mobile-only">
                  <button id="btn-toggle-layers" title="Toggle Layers"><i data-app-icon="layers"></i></button>
                  <button id="btn-toggle-props" title="Toggle Properties"><i data-app-icon="info"></i></button>
                  <button id="btn-toggle-ai" title="Toggle AI"><i data-app-icon="bot"></i></button>
              </div>

              <aside className="sidebar-left" id="sidebar-left">
                  <div className="panel">
                      <header style={{ cursor: 'pointer' }} id="header-layers-toggle">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <i data-app-icon="chevron-down" id="icon-layers-toggle" style={{ width: '16px', transition: 'transform 0.2s' }}></i>
                              <span>Layers Group</span>
                          </div>
                          <button className="side-collapse-btn" id="btn-collapse-left" title="Collapse Sidebar" style={{ pointerEvents: 'auto' }}><i data-app-icon="chevron-left"></i></button>
                      </header>
                      <div id="layers-collapsible-wrapper">
                          <div className="layer-list" id="layer-list"></div>
                          <button className="btn-small" id="btn-add-layer"><i data-app-icon="plus"></i> New Layer</button>
                      </div>
                  </div>
                  <div className="panel">
                      <header>Properties</header>
                      <div id="properties-panel" className="property-content">
                          <p className="empty-state">No entity selected</p>
                      </div>
                  </div>
              </aside>

              <div id="canvas-container">
                  <button className="side-expand-btn left hidden" id="btn-expand-left" title="Expand Layers">
                      <i data-app-icon="chevron-right"></i>
                  </button>
                  <button className="side-expand-btn right hidden" id="btn-expand-right" title="Expand Standards">
                      <i data-app-icon="chevron-left"></i>
                  </button>
                  <canvas id="main-canvas" data-paper-resize="true"></canvas>
                  <div id="snap-indicator"></div>
                  <div id="coord-display">X: 0.00 Y: 0.00</div>
                  <div id="zoom-display">Zoom: 100%</div>
                  <div id="view-controls">
                      <button id="btn-zoom-in" title="Zoom In"><i data-app-icon="zoom-in"></i></button>
                      <button id="btn-zoom-out" title="Zoom Out"><i data-app-icon="zoom-out"></i></button>
                      <button id="btn-zoom-reset" title="Reset Zoom"><i data-app-icon="refresh-cw"></i></button>
                  </div>
              </div>

              <aside className="sidebar-right" id="sidebar-right">
                  <div className="panel">
                      <header>
                          <span>Standards</span>
                          <button className="side-collapse-btn" id="btn-collapse-right" title="Collapse Sidebar"><i data-app-icon="chevron-right"></i></button>
                      </header>
                      <div className="standards-content">
                          <label>Current Standard:</label>
                          <select id="standard-select">
                              <option value="SANS">SANS 10111 (South Africa)</option>
                              <option value="ISO">ISO 128 / 7200</option>
                              <option value="ANSI">ANSI Y14.5</option>
                              <option value="DIN">DIN / BSI</option>
                          </select>
                          <div style={{ marginTop: '15px' }}>
                              <label>Sheet Layout:</label>
                              <select id="sheet-select" className="pro-select-sm" style={{ width: '100%', marginTop: '5px' }}>
                                  <option value="none">No Template</option>
                                  <option value="A4">A4 (210x297mm)</option>
                                  <option value="A3">A3 (420x297mm)</option>
                                  <option value="A2">A2 (594x420mm)</option>
                                  <option value="A1">A1 (841x594mm)</option>
                                  <option value="A0">A0 (1189x841mm)</option>
                              </select>
                              <div className="template-metadata" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input type="text" id="sheet-project" placeholder="Project Title" className="pro-input" style={{ fontSize: '11px', height: '26px' }} />
                                  <input type="text" id="sheet-designer" placeholder="Drawn By" className="pro-input" style={{ fontSize: '11px', height: '26px' }} />
                                  <input type="text" id="sheet-date" placeholder="Date (DD/MM/YYYY)" className="pro-input" style={{ fontSize: '11px', height: '26px' }} />
                              </div>
                              <button className="btn-small" id="btn-insert-template" style={{ marginTop: '8px', width: '100%' }}>Apply Template</button>
                          </div>
                          <div className="compliance-check">
                              <button className="btn-primary" id="btn-validate" style={{ width: '100%' }}>Run Validation</button>
                              <button className="btn-action" id="btn-ai-audit" style={{ width: '100%', marginTop: '5px' }}>
                                  <i data-app-icon="shield-check"></i> AI Compliance Audit
                              </button>
                              <div id="validation-results">
                                  <span className="badge success">Standard Compliant</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <footer className="footer">
                      <p> Developed by Siyabonga B Phakathi of The Voice & Eye of Bhambatha Inc. © 2026 </p>
                  </footer>
              </aside>
          </main>

          <div id="modal-container"></div>
          
          <footer className="status-bar relative z-30">
              <div className="status-group">
                  <div className="command-bar">
                      <span className="cmd-prompt">ENG:</span>
                      <input type="text" id="command-input" placeholder="Type command (e.g. LINE, CIRCLE)..." autoComplete="off" />
                  </div>
                  <div className="status-msg" id="status-msg">READY</div>
                  <div id="power-telemetry" className="telemetry-chip hidden">
                      <i data-app-icon="zap"></i> <span id="telemetry-val">0mW</span>
                  </div>
                  <div id="connection-status" className="conn-status online" title="Connectivity Status">
                      <i data-app-icon="zap"></i> <span className="conn-text">Online</span>
                  </div>
              </div>
              <div className="snap-settings">
                  <div className="snap-group">
                      <label><input type="checkbox" defaultChecked id="snap-grid" /> Grid</label>
                  </div>
                  <label><input type="checkbox" defaultChecked id="snap-object" /> Obj</label>
                  <label><input type="checkbox" id="snap-ortho" /> Ortho</label>
                  <label><input type="checkbox" defaultChecked id="snap-angle" /> Angle</label>
              </div>
              <div className="units-display">Units: mm</div>
          </footer>
      </div>

      <input type="file" id="import-input" accept="image/*" style={{ display: 'none' }} />
      <input type="file" id="project-import-input" accept=".engigraph.json,.json" style={{ display: 'none' }} />
    </div>
  );
}
