import { FordSurveyPayload, createDefaultFordPayload } from '../types/ford';
import { Model } from 'survey-core';
import { ExpanseEvent, ExpanseSurvey } from '../types/expanse';
import { SurveyData, CustomSurveyData } from '../types/survey';

/**
 * Maps SurveyJS data and question FFS/custom fields to a Ford API-compliant payload.
 * @param survey The SurveyJS Model instance
 * @param surveyData The raw survey data object
 * @param event (optional) event data for event_id etc.
 */
export function mapToFordPayload(survey: Model, surveyData: SurveyData, event?: ExpanseEvent): FordSurveyPayload {
  console.log('[Ford Mapper DEBUG] Starting Ford payload mapping');
  console.log('[Ford Mapper DEBUG] Survey data keys:', Object.keys(surveyData));
  console.log('[Ford Mapper DEBUG] Survey data address_group:', (surveyData as Record<string, unknown>).address_group);
  console.log('[Ford Mapper DEBUG] Survey model questions count:', survey.getAllQuestions().length);
  
  const ffsData: Record<string, string | number | string[] | null> = {};
  const customData: CustomSurveyData = {};

  survey.getAllQuestions().forEach((question, index) => {
    const questionName = question.name;
    const ffsKey = question.getPropertyValue('_ffs');
    // Get the value from surveyData, not from question.value (which is only populated if model.data was set)
    const questionValue = surveyData[questionName];
    
    console.log(`[Ford Mapper DEBUG] Question ${index + 1}:`, {
      name: questionName,
      ffs: ffsKey,
      value: questionValue,
      hasValue: questionValue !== undefined && questionValue !== null
    });
    
    // Handle waiver fields by their question names
    if (questionName === 'adultWaiver' && questionValue) {
      // Safely extract the signature string
      if (typeof questionValue === 'object' && questionValue !== null && 'signature' in questionValue) {
        const sig = (questionValue as Record<string, unknown>).signature;
        ffsData['signature'] = typeof sig === 'string' ? sig : null;
      } else {
        ffsData['signature'] = null;
      }
    } else if (questionName === 'minorWaiver' && questionValue) {
      // For minors, only set signature if minorsYesNo is '1' (yes)
      if (typeof questionValue === 'object' && questionValue !== null) {
        const minorWaiverData = questionValue as Record<string, unknown>;
        if (minorWaiverData.minorsYesNo === '1') {
          // Extract the minor names - they might be in properties like minorName1, minorName2, etc.
          const minorNames: string[] = [];
          for (const key in minorWaiverData) {
            if (key.startsWith('minorName') && minorWaiverData[key]) {
              minorNames.push(String(minorWaiverData[key]));
            }
          }
          ffsData['minor_signature'] = minorNames.length > 0 ? minorNames.join(', ') : null;
        } else {
          ffsData['minor_signature'] = null;
        }
      } else {
        ffsData['minor_signature'] = null;
      }
    } else if (ffsKey) {
      console.log(`[Ford Mapper DEBUG] Processing FFS key: ${ffsKey} for question: ${questionName}`);
      if (ffsKey === 'address_group') {
        console.log('[Ford Mapper DEBUG] Found address_group question!');
        if (typeof questionValue === 'object' && questionValue !== null) {
          const addressData = questionValue as Record<string, unknown>;
          console.log('[Ford Mapper DEBUG] Address data from question:', addressData);
          ffsData['address1'] = typeof addressData.address1 === 'string' ? addressData.address1 : null;
          ffsData['address2'] = typeof addressData.address2 === 'string' ? addressData.address2 : null;
          ffsData['city'] = typeof addressData.city === 'string' ? addressData.city : null;
          ffsData['state'] = typeof addressData.state === 'string' ? addressData.state : null;
          ffsData['zip_code'] = typeof addressData.zip_code === 'string' ? addressData.zip_code : null;
          ffsData['country_code'] = typeof addressData.country === 'string' ? addressData.country : null;
        }
        console.log('[Ford Mapper DEBUG] Set address fields:', {
          address1: ffsData['address1'],
          city: ffsData['city'], 
          state: ffsData['state'],
          zip_code: ffsData['zip_code']
        });
      } else if (ffsKey === 'voi') {
        // VOI can be string or string array
        if (typeof questionValue === 'string' || Array.isArray(questionValue)) {
          ffsData[ffsKey] = questionValue;
        } else {
          ffsData[ffsKey] = null;
        }
      } else if (ffsKey === 'emailOptIn') {
        // Email opt-in should be a number (0 or 1)
        if (typeof questionValue === 'number') {
          ffsData['email_opt_in'] = questionValue;
        } else if (typeof questionValue === 'string') {
          const num = parseInt(questionValue, 10);
          ffsData['email_opt_in'] = !isNaN(num) ? num : null;
        } else {
          ffsData['email_opt_in'] = null;
        }
      } else if (ffsKey === 'age_bracket') {
        if (typeof questionValue === 'string') {
          const ageValue = questionValue;
          if (ageValue === '18 - 20' || ageValue === '21 - 24') {
            ffsData['age_bracket'] = '18 - 24';
          } else {
            ffsData['age_bracket'] = ageValue;
          }
        } else {
          ffsData['age_bracket'] = null;
        }
      } else if (ffsKey.startsWith('custom.')) {
        // Custom data can be various types - preserve as-is if valid
        if (questionValue !== undefined && questionValue !== null) {
          customData[ffsKey.replace('custom.', '')] = questionValue as string | number | boolean | Record<string, unknown>;
        }
      } else if (ffsKey === 'signature' && typeof questionValue === 'object' && questionValue && 'signature' in questionValue) {
        // Extract signature string from object
        ffsData[ffsKey] = String((questionValue as Record<string, unknown>).signature);
      } else if (ffsKey === 'minor_signature' && typeof questionValue === 'object' && questionValue !== null) {
        // Extract minor signature based on minorsYesNo value
        const valueObj = questionValue as Record<string, unknown>;
        if (valueObj.minorsYesNo === '1' && valueObj.minorSignature) {
          ffsData[ffsKey] = String(valueObj.minorSignature);
        } else {
          ffsData[ffsKey] = null;
        }
      } else {
        console.log(`[Ford Mapper DEBUG] Setting FFS field ${ffsKey} to:`, questionValue);
        // For other fields, preserve primitive values as-is
        if (typeof questionValue === 'string' || typeof questionValue === 'number') {
          ffsData[ffsKey] = questionValue;
        } else if (typeof questionValue === 'boolean') {
          // Convert boolean to number (0 or 1) for API compatibility
          ffsData[ffsKey] = questionValue ? 1 : 0;
        } else if (Array.isArray(questionValue)) {
          // Handle arrays (e.g., multi-select fields)
          ffsData[ffsKey] = questionValue;
        } else if (questionValue === null || questionValue === undefined) {
          ffsData[ffsKey] = null;
        } else {
          // For objects or other types, convert to string if possible
          console.warn(`[Ford Mapper] Unexpected type for FFS field ${ffsKey}:`, typeof questionValue);
          ffsData[ffsKey] = String(questionValue);
        }
      }
    } else {
      console.log(`[Ford Mapper DEBUG] Question ${questionName} has no _ffs key`);
    }
  });

  console.log('[Ford Mapper DEBUG] Final ffsData collected:', ffsData);

  // Restore explicit custom_data keys from surveyData if present
  [
    'overall_opinion',
    'current_owner',
    'brand_for_me',
    'minorName1',
    'minorName2',
    'minorName3'
  ].forEach(key => {
    if (surveyData[key] !== undefined && surveyData[key] !== null) {
      const value = surveyData[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
          (typeof value === 'object' && value !== null)) {
        customData[key] = value as string | number | boolean | Record<string, unknown>;
      }
    }
  });

  // Compose the FordSurvey object
  const fordSurvey: FordSurveyPayload = createDefaultFordPayload();
  
  // Helper function to filter out undefined values
  const filterUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    const filtered: Partial<T> = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        filtered[key] = obj[key];
      }
    }
    return filtered;
  };
  
  Object.assign(fordSurvey, {
    ...filterUndefined(ffsData),
    ...filterUndefined(surveyData),
    custom_data: (Object.keys(customData).length > 0 || surveyData.customData)
      ? JSON.stringify({ ...customData, ...(surveyData.customData || {}) })
      : null,
    ...(event ? { 
      event_id: event.fordEventID || '',
      survey_type: event.surveyType || "basic"
    } : {}),
  });
  

  // Final safety check - ensure signature fields are strings or null, never objects
  if (typeof fordSurvey.signature === 'object') {
    console.warn('[mapSurveyToFord] Signature is an object, extracting string value or setting to null');
    if (fordSurvey.signature && typeof fordSurvey.signature === 'object' && 'signature' in fordSurvey.signature) {
      fordSurvey.signature = String((fordSurvey.signature as Record<string, unknown>).signature || '');
    } else {
      fordSurvey.signature = null;
    }
  }
  
  if (typeof fordSurvey.minor_signature === 'object') {
    console.warn('[mapSurveyToFord] Minor signature is an object, setting to null');
    fordSurvey.minor_signature = null;
  }

  // Log final signature values for debugging
  console.log('[mapSurveyToFord] Final signature values:', {
    signature: fordSurvey.signature,
    minor_signature: fordSurvey.minor_signature,
    signature_type: typeof fordSurvey.signature,
    minor_signature_type: typeof fordSurvey.minor_signature
  });

  // Ensure custom_data is always present
  if (!fordSurvey.custom_data) {
    fordSurvey.custom_data = null;
  }

  return fordSurvey;
}
