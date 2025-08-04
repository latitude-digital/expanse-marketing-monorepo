import { Question } from "survey-core";

/**
 * Generic choicesByUrl handler for SurveyJS custom question types.
 * 
 * SurveyJS custom question types don't automatically support choicesByUrl,
 * so this helper manually fetches and populates choices using the configured
 * choicesByUrl properties (url, valueName, titleName, titleText).
 * 
 * @param question - The SurveyJS question instance
 * @param contextName - Name for logging context (e.g., 'FordSurveys', 'LincolnSurveys')
 */
export const handleChoicesByUrl = (question: Question, contextName: string = 'SurveyJS') => {
  // Check if choices already have originalData
  const hasOriginalData = question.choices.length > 0 && question.choices.some((choice: any) => choice.originalData);
  
  // Proceed if question has choicesByUrl configuration and either no choices OR choices without originalData
  if (question.choicesByUrl && (question.choices.length === 0 || !hasOriginalData)) {
    const { url, valueName, titleName, titleText } = question.choicesByUrl;
    
    if (!url) {
      console.warn(`[${contextName}] Question ${question.name} has choicesByUrl but no URL specified`);
      return;
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Transform data to SurveyJS choice format using the configured property names
        // IMPORTANT: Store original data to preserve Ford JSON properties (type, image, etc.)
        const choices = data.map((item: any) => ({
          value: valueName ? item[valueName] : item.value,
          text: titleName ? item[titleName] : (titleText || item.text || item.title),
          originalData: item  // Store complete original Ford JSON data
        }));
        
        // Apply sorting based on data structure
        let sortedChoices = choices;
        
        // Special sorting for vehicle makes (if this endpoint has sort_top property)
        if (data[0]?.sort_top !== undefined) {
          sortedChoices = choices.sort((a: any, b: any) => {
            const aItem = data.find((d: any) => (valueName ? d[valueName] : d.value) === a.value);
            const bItem = data.find((d: any) => (valueName ? d[valueName] : d.value) === b.value);
            
            // Sort by sort_top (1 = top brands, 0 = others), then alphabetically
            if (aItem?.sort_top !== bItem?.sort_top) {
              return (bItem?.sort_top || 0) - (aItem?.sort_top || 0); // Top brands first
            }
            return a.text.localeCompare(b.text); // Alphabetical within each group
          });
        } else {
          // Default alphabetical sorting for other endpoints
          sortedChoices = choices.sort((a: any, b: any) => a.text.localeCompare(b.text));
        }
        
        // Set the choices on the question
        question.choices = sortedChoices;
      })
      .catch(error => {
        console.error(`[${contextName}] Failed to fetch choices for question ${question.name} from ${url}:`, error);
      });
  }
};