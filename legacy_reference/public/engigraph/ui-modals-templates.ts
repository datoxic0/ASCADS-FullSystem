/**
 * HTML Skeletons for the system's modal overlays.
 * Separated to reduce file size and improve maintainability of ui-modals.js.
 */
export const ModalTemplates = {
    mainContainer: `
        <!-- Vectorize Overlay -->
        <div id="vectorize-overlay" class="overlay hidden">
            <div class="modal pro-modal">
                <div class="modal-header">
                    <h3>Raster Digitization</h3>
                    <button class="close-modal" id="btn-close-vectorize">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Converting scanned imagery to parametric geometry...</p>
                    <div class="progress-bar"><div class="progress-fill"></div></div>
                    <div id="vectorize-status" class="status-text">Analyzing Image...</div>
                </div>
            </div>
        </div>

        <!-- Generic Notification Modal -->
        <div id="generic-modal" class="overlay hidden">
            <div class="modal pro-modal">
                <div class="modal-header">
                    <h3 id="modal-title">Notification</h3>
                    <button class="close-modal" id="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="modal-body"></div>
                <div class="modal-footer">
                    <button class="btn-primary" id="modal-ok">OK</button>
                </div>
            </div>
        </div>

        <!-- Thesis / Documentation Modal -->
        <div id="thesis-modal-overlay" class="overlay hidden">
            <div class="modal pro-modal thesis-modal">
                <div class="modal-header">
                    <h3><i data-modal-icon="book-open"></i> EngiGraph Pro: System Thesis & Engineering Documentation</h3>
                    <button class="close-modal" id="btn-close-thesis">&times;</button>
                </div>
                <div class="thesis-container">
                    <nav class="thesis-nav">
                        <button class="thesis-nav-btn active" data-section="abstract">Executive Abstract</button>
                        <button class="thesis-nav-btn" data-section="manual">User Manual & Ref</button>
                        <button class="thesis-nav-btn" data-section="standards">SANS 10111 & ISO</button>
                        <button class="thesis-nav-btn" data-section="tutorial">Usage Tutorial</button>
                        <button class="thesis-nav-btn" data-section="math">Advanced Algorithms</button>
                        <button class="thesis-nav-btn" data-section="mechatronics">Mechatronics Suite</button>
                    </nav>
                    <main class="thesis-content" id="thesis-content-body">
                        <!-- Dynamic Content -->
                    </main>
                </div>
            </div>
        </div>

        <!-- AI Modal -->
        <div id="ai-modal-overlay" class="overlay hidden">
            <div class="modal pro-modal ai-modal">
                <div class="modal-header">
                    <h3><i data-modal-icon="bot"></i> EngiGraph AI Assistant</h3>
                    <button class="close-modal" id="btn-close-ai">&times;</button>
                </div>
                <div class="modal-body ai-chat-container">
                    <div class="ai-messages" id="ai-messages">
                        <div class="msg system">Ready to assist with technical drafting and ISO standards.</div>
                    </div>
                </div>
                <div class="modal-footer ai-input-area">
                    <div class="ai-input-group">
                        <input type="text" id="ai-input" placeholder="Ask about ISO 128, dimensioning, or help...">
                        <button id="ai-send" class="btn-primary"><i data-modal-icon="send"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Code View / DX Modal -->
        <div id="code-view-overlay" class="overlay hidden">
            <div class="modal pro-modal code-modal">
                <div class="modal-header">
                    <h3><i data-modal-icon="code"></i> Engineering Source & Developer Experience</h3>
                    <button class="close-modal" id="btn-close-code">&times;</button>
                </div>
                <div class="modal-tabs">
                    <button class="code-tab-btn active" data-format="json">JSON (EngiGraph)</button>
                    <button class="code-tab-btn" data-format="python">Python (SchemDraw)</button>
                </div>
                <div class="modal-body">
                    <textarea id="code-editor" class="pro-textarea" placeholder="Source code will appear here..."></textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn-action" id="btn-copy-code"><i data-modal-icon="copy"></i> Copy to Clipboard</button>
                    <button class="btn-primary" id="btn-apply-code">Import & Apply (JSON only)</button>
                </div>
            </div>
        </div>
    `
};