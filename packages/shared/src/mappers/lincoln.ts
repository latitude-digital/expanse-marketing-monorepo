import { LincolnSurveyPayload, createDefaultLincolnPayload } from '../types/lincoln';
import { Model } from 'survey-core';
import { MeridianEvent } from '../types/meridian-event';
import { MeridianSurveyData as SurveyData, CustomSurveyData } from '../types/core';

/**
 * Maps SurveyJS data and question FFS/custom fields to a Lincoln API-compliant payload.
 * @param survey The SurveyJS Model instance
 * @param surveyData The raw survey data object
 * @param event (optional) event data for event_id etc.
 */
export function mapToLincolnPayload(survey: Model, surveyData: SurveyData, event?: MeridianEvent): LincolnSurveyPayload {
  console.log('[Lincoln Mapper] Starting mapping with survey questions count:', survey.getAllQuestions().length);
  console.log('[Lincoln Mapper] Survey data keys:', Object.keys(surveyData));
  
  const ffsData: Record<string, string | number | string[] | null> = {};
  const customData: CustomSurveyData = {};

  survey.getAllQuestions().forEach((question, index) => {
    const questionName = question.name;
    const ffsKey = question.getPropertyValue('_ffs');
    // Get the value from surveyData, not from question.value (which is only populated if model.data was set)
    const questionValue = surveyData[questionName];
    
    console.log(`[Lincoln Mapper] Q${index + 1}:`, {
      name: questionName,
      ffs: ffsKey,
      valueExists: questionValue !== undefined,
      valueType: typeof questionValue
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
      if (ffsKey === 'address_group') {
        if (typeof questionValue === 'object' && questionValue !== null) {
          const addressData = questionValue as Record<string, unknown>;
          ffsData['address1'] = typeof addressData.address1 === 'string' ? addressData.address1 : null;
          ffsData['address2'] = typeof addressData.address2 === 'string' ? addressData.address2 : null;
          ffsData['city'] = typeof addressData.city === 'string' ? addressData.city : null;
          ffsData['state'] = typeof addressData.state === 'string' ? addressData.state : null;
          ffsData['zip_code'] = typeof addressData.zip_code === 'string' ? addressData.zip_code : null;
          // Use 3-char country code from Google Autocomplete, default to USA
          const country = typeof addressData.country === 'string' ? addressData.country : 
                          (typeof addressData.country_code === 'string' ? addressData.country_code : "USA");
          ffsData['country_code'] = country;
        }
      } else if (ffsKey === 'voi') {
        // VOI can be string or string array
        if (typeof questionValue === 'string' || Array.isArray(questionValue)) {
          ffsData[ffsKey] = questionValue;
        } else {
          ffsData[ffsKey] = null;
        }
      } else if (ffsKey === 'vehiclesDriven') {
        // Normalize to API field 'vehicles_driven' (snake_case) expected by v13
        if (typeof questionValue === 'string') {
          (ffsData as any)['vehicles_driven'] = [questionValue];
        } else if (Array.isArray(questionValue)) {
          (ffsData as any)['vehicles_driven'] = questionValue as string[];
        } else {
          (ffsData as any)['vehicles_driven'] = null;
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
          console.warn(`[Lincoln Mapper] Unexpected type for FFS field ${ffsKey}:`, typeof questionValue);
          ffsData[ffsKey] = String(questionValue);
        }
      }
    }
  });

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

  // Compose the Lincoln survey object
  const lincolnSurvey: LincolnSurveyPayload = createDefaultLincolnPayload();
  
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
  
  // IMPORTANT: Do NOT remove pre_drive_survey_guid - it's already set to null in createDefaultFordSurvey()
  // The Lincoln API requires this field to be present, even if null
  
  Object.assign(lincolnSurvey, {
    ...filterUndefined(ffsData),
    ...filterUndefined(surveyData),
    custom_data: (Object.keys(customData).length > 0 || surveyData.customData)
      ? JSON.stringify({ ...customData, ...(surveyData.customData || {}) })
      : null,
    ...(event ? { 
      event_id: event.lincolnEventID || '',
      survey_type: event.surveyType || "basic"
    } : {}),
    // Only set language explicitly, let other fields come from ffsData/surveyData
    language: String(surveyData._language || surveyData.language || "en").substring(0, 2),
  });

  // Ensure country_code defaults to USA if not set by address_group
  if (!lincolnSurvey.country_code) {
    lincolnSurvey.country_code = "USA";
  }
  

  // Final safety check - ensure signature fields are strings or null, never objects
  if (typeof lincolnSurvey.signature === 'object') {
    console.warn('[mapSurveyToLincoln] Signature is an object, extracting string value or setting to null');
    if (lincolnSurvey.signature && typeof lincolnSurvey.signature === 'object' && 'signature' in lincolnSurvey.signature) {
      lincolnSurvey.signature = String((lincolnSurvey.signature as Record<string, unknown>).signature || '');
    } else {
      lincolnSurvey.signature = null;
    }
  }
  
  if (typeof lincolnSurvey.minor_signature === 'object') {
    console.warn('[mapSurveyToLincoln] Minor signature is an object, setting to null');
    lincolnSurvey.minor_signature = null;
  }

  // Log final signature values for debugging
  console.log('[mapSurveyToLincoln] Final signature values:', {
    signature: lincolnSurvey.signature,
    minor_signature: lincolnSurvey.minor_signature,
    signature_type: typeof lincolnSurvey.signature,
    minor_signature_type: typeof lincolnSurvey.minor_signature
  });

  // Ensure custom_data is always present as a valid JSON string
  if (!lincolnSurvey.custom_data) {
    lincolnSurvey.custom_data = '{}';
  }

  return lincolnSurvey;
}
