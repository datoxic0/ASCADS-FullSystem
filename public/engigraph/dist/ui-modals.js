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
        if (!container)
            return;
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
            if (e.key === 'Enter')
                this.app.ai.handleAIChat();
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
        if (!overlay)
            return;
        overlay.classList.add('hidden');
        if (overlay.id === 'ai-modal-overlay') {
            const input = document.getElementById('ai-input');
            if (input)
                input.value = '';
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
        if (!body)
            return;
        body.innerHTML = DocumentationContent[section] || DocumentationContent.abstract;
        body.scrollTop = 0;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktbW9kYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdWktbW9kYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDMUQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFckU7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLFlBQVk7SUFDckIsWUFBWSxHQUFHLEVBQUUsRUFBRTtRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQU07UUFDRixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFNBQVM7WUFBRSxPQUFPO1FBRXZCLFNBQVMsQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQztRQUVuRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsV0FBVyxDQUFDO1lBQ1IsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDcEQsUUFBUSxFQUFFLGlCQUFpQjtTQUM5QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZUFBZTtRQUNYLHFFQUFxRTtRQUNyRSxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFN0QsU0FBUyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3RDLE1B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