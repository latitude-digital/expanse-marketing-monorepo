import { FordSurvey, createDefaultFordSurvey } from './fordSurvey';

/**
 * Maps SurveyJS data and question FFS/custom fields to a FordSurvey-compliant object.
 * @param survey The SurveyJS Model instance
 * @param surveyData The raw survey data object
 * @param event (optional) event data for event_id etc.
 */
export function mapSurveyToFordSurvey(survey: any, surveyData: any, event?: any): FordSurvey {
  const ffsData: any = {};
  const customData: any = {};

  survey.getAllQuestions().forEach((question: any) => {
    const ffsKey = question.getPropertyValue('_ffs');
    const questionName = question.name;
    
    // Handle waiver fields by their question names
    if (questionName === 'adultWaiver' && question.value) {
      // Just extract the signature string directly
      ffsData['signature'] = question.value.signature || null;
    } else if (questionName === 'minorWaiver' && question.value) {
      // For minors, only set signature if minorsYesNo is '1' (yes)
      if (question.value.minorsYesNo === '1') {
        // Extract the minor names - they might be in properties like minorName1, minorName2, etc.
        const minorNames = [];
        for (const key in question.value) {
          if (key.startsWith('minorName') && question.value[key]) {
            minorNames.push(question.value[key]);
          }
        }
        ffsData['minor_signature'] = minorNames.length > 0 ? minorNames.join(', ') : null;
      } else {
        ffsData['minor_signature'] = null;
      }
    } else if (ffsKey) {
      if (ffsKey === 'address_group') {
        const addressData = question.value || {};
        ffsData['address1'] = addressData.address1 || null;
        ffsData['address2'] = addressData.address2 || null;
        ffsData['city'] = addressData.city || null;
        ffsData['state'] = addressData.state || null;
        ffsData['zip_code'] = addressData.zip_code || null;
        ffsData['country_code'] = addressData.country || null;
      } else if (ffsKey === 'voi') {
        ffsData[ffsKey] = question.value;
      } else if (ffsKey === 'emailOptIn') {
        ffsData['email_opt_in'] = question.value;
      } else if (ffsKey === 'age_bracket') {
        if (question.value === '18 - 20' || question.value === '21 - 24') {
          ffsData['age_bracket'] = '18 - 24';
        } else {
          ffsData['age_bracket'] = question.value;
        }
      } else if (ffsKey.startsWith('custom.')) {
        customData[ffsKey.replace('custom.', '')] = question.value;
      } else if (ffsKey === 'signature' && typeof question.value === 'object' && question.value?.signature) {
        // Extract signature string from object
        ffsData[ffsKey] = question.value.signature;
      } else if (ffsKey === 'minor_signature' && typeof question.value === 'object') {
        // Extract minor signature based on minorsYesNo value
        ffsData[ffsKey] = question.value.minorsYesNo === '1' ? (question.value.minorSignature || null) : null;
      } else {
        ffsData[ffsKey] = typeof question.value !== 'undefined' ? question.value : null;
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
      customData[key] = surveyData[key];
    }
  });

  // Compose the FordSurvey object
  const fordSurvey: FordSurvey = createDefaultFordSurvey();
  Object.assign(fordSurvey, {
    ...ffsData,
    ...surveyData,
    custom_data: (Object.keys(customData).length > 0 || surveyData.customData)
      ? JSON.stringify({ ...customData, ...(surveyData.customData || {}) })
      : null,
    ...(event ? { 
      event_id: event.fordEventID,
      survey_type: event.surveyType || "basic"
    } : {}),
  });
  

  // Final safety check - ensure signature fields are strings or null, never objects
  if (typeof fordSurvey.signature === 'object') {
    console.warn('[mapSurveyToFord] Signature is an object, extracting string value or setting to null');
    if (fordSurvey.signature && typeof fordSurvey.signature === 'object' && 'signature' in fordSurvey.signature) {
      fordSurvey.signature = (fordSurvey.signature as any).signature;
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
