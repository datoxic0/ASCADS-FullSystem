import { CoreTemplates } from './ui-ribbon-templates-core.js';
import { EngineeringTemplates } from './ui-ribbon-templates-engineering.js';
import { MechatronicTemplates } from './ui-ribbon-templates-mechatronic.js';

/**
 * Aggregator for Ribbon UI Tab Templates.
 * Refactored into modular template providers.
 */
export const RibbonSections = {
    renderHomeTab: CoreTemplates.renderHomeTab,
    renderDrawTab: EngineeringTemplates.renderDrawTab,
    renderComponentsTab: MechatronicTemplates.renderComponentsTab,
    renderModellingTab: EngineeringTemplates.renderModellingTab,
    renderAnnotateTab: EngineeringTemplates.renderAnnotateTab,
    renderDigitizeTab: EngineeringTemplates.renderDigitizeTab,
    renderCircuitTab: MechatronicTemplates.renderCircuitTab,
    renderOutputTab: CoreTemplates.renderOutputTab,
    renderAITab: MechatronicTemplates.renderAITab,
    renderHelpTab: CoreTemplates.renderHelpTab,

    // removed renderHomeTab() as local literal {}
    // removed renderDrawTab() as local literal {}
    // removed renderComponentsTab() as local literal {}
    // removed renderModellingTab() as local literal {}
    // removed renderAnnotateTab() as local literal {}
    // removed renderDigitizeTab() as local literal {}
    // removed renderCircuitTab() as local literal {}
    // removed renderOutputTab() as local literal {}
    // removed renderAITab() as local literal {}
    // removed renderHelpTab() as local literal {}
};