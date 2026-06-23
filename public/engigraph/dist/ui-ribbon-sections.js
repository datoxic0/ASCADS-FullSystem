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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktcmliYm9uLXNlY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdWktcmliYm9uLXNlY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUM1RSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUU1RTs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUc7SUFDMUIsYUFBYSxFQUFFLGFBQWEsQ0FBQyxhQUFhO0lBQzFDLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxhQUFhO0lBQ2pELG1CQUFtQixFQUFFLG9CQUFvQixDQUFDLG1CQUFtQjtJQUM3RCxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxrQkFBa0I7SUFDM0QsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsaUJBQWlCO0lBQ3pELGlCQUFpQixFQUFFLG9CQUFvQixDQUFDLGlCQUFpQjtJQUN6RCxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQyxnQkFBZ0I7SUFDdkQsZUFBZSxFQUFFLGFBQWEsQ0FBQyxlQUFlO0lBQzlDLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxXQUFXO0lBQzdDLGFBQWEsRUFBRSxhQUFhLENBQUMsYUFBYTtJQUUxQyw4Q0FBOEM7SUFDOUMsOENBQThDO0lBQzlDLG9EQUFvRDtJQUNwRCxtREFBbUQ7SUFDbkQsa0RBQWtEO0lBQ2xELGtEQUFrRDtJQUNsRCxpREFBaUQ7SUFDakQsZ0RBQWdEO0lBQ2hELDRDQUE0QztJQUM1Qyw4Q0FBOEM7Q0FDakQsQ0FBQyJ9