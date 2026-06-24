import { createIcons, Bot, Send, Code, FileCode, Copy, BookOpen } from 'https://esm.sh/lucide';
import { ModalTemplates } from './ui-modals-templates.js';
import { DocumentationContent } from './ui-documentation-content.js';

/**
 * Manages the generation and logic of modal overlays.
 * Refactored to separate large static HTML templates into dedicated files.
 */
export class ModalManager {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;
    }

    render() {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = ModalTemplates.mainContainer;
        
        this.attachListeners();
        createIcons({ 
            icons: { Bot, Send, Code, FileCode, Copy, BookOpen },
            nameAttr: 'data-modal-icon'
        });
    }

    attachListeners() {
        // Universal close logic: Handle clicks on backdrop and close buttons
        const container = document.getElementById('modal-container');
        
        container.addEventListener('click', (e) => {
            const isCloseBtn = e.target.closest('.close-modal');
            const isBackdrop = e.target.classList.contains('overlay');
            
            if (isCloseBtn || isBackdrop) {
                const overlay = e.target.closest('.overlay');
                if (overlay) {
                    this.closeModal(overlay);
                }
            }
        });

        // Prevention of duplicate AI listeners
        const aiSendBtn = document.getElementById('ai-send');
        if (aiSendBtn) {
            aiSendBtn.onclick = () => this.app.ai.handleAIChat();
        }
        document.getElementById('ai-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.app.ai.handleAIChat();
        });

        // Delegate thesis nav clicks
        document.querySelector('.thesis-nav')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.thesis-nav-btn');
            if (btn) {
                document.querySelectorAll('.thesis-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderThesisSection(btn.dataset.section);
            }
        });

        // Code Tab switching
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.code-tab-btn');
            if (btn) {
                document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.ui.updateCodeViewFormat(btn.dataset.format);
            }
        });
    }

    closeModal(overlay) {
        if (!overlay) return;
        overlay.classList.add('hidden');
        if (overlay.id === 'ai-modal-overlay') {
            const input = document.getElementById('ai-input');
            if (input) input.value = '';
        }
    }

    showThesis(section = 'abstract') {
        document.getElementById('thesis-modal-overlay').classList.remove('hidden');
        this.renderThesisSection(section);
        // Sync nav state
        document.querySelectorAll('.thesis-nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.section === section);
        });
    }

    renderThesisSection(section) {
        const body = document.getElementById('thesis-content-body');
        if (!body) return;

        body.innerHTML = DocumentationContent[section] || DocumentationContent.abstract;
        body.scrollTop = 0;
    }

    // removed render() literal HTML {}
    // removed local documentation content {}
}