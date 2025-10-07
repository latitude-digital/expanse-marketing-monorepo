/**
 * Shared utility for uploading surveys to Ford and Lincoln APIs
 */

import { Model } from 'survey-core';
import { mapToFordPayload } from '../mappers/ford';
import { mapToLincolnPayload } from '../mappers/lincoln';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { MeridianEvent } from '../types/meridian-event';
import { MeridianSurveyData as SurveyData } from '../types/core';
import { 
  getCurrentEnvironment,
  normalizeBrand,
  getFordApiUrl,
  getLincolnApiUrl,
  FORD_ENDPOINTS,
  LINCOLN_ENDPOINTS,
  FORD_AUTH_TOKEN,
  LINCOLN_AUTH_TOKEN
} from './config';
import { registerUniversalQuestions } from '../surveyjs/universal-registration';

export interface UploadResult {
  success: boolean;
  error?: string;
  details?: unknown;
}

/**
 * Upload a survey to the appropriate brand API (Ford or Lincoln)
 * @param event - The event object containing brand info, event IDs, surveyType, and optionally surveyJSModel
 * @param surveyData - The survey answers/data from the completed survey
 * @param surveyModel - Optional SurveyJS Model instance (can be recreated from event.surveyJSModel if not provided)
 */
export async function uploadSurveyToAPI(
  event: MeridianEvent,
  surveyData: SurveyData,
  surveyModel?: Model
): Promise<UploadResult> {
  try {
    console.log('[Upload] Start - surveyModel provided:', !!surveyModel);
    console.log('[Upload] Event has surveyJSModel:', !!event.surveyJSModel);
    
    // Recreate the survey model if not provided
    let model = surveyModel;
    if (!model && event.surveyJSModel) {
      // Parse surveyJSModel if it's a string
      const modelJson = typeof event.surveyJSModel === 'string' 
        ? JSON.parse(event.surveyJSModel) 
        : event.surveyJSModel;
      
      console.log('[Upload] Creating Model from surveyJSModel:', {
        isString: typeof event.surveyJSModel === 'string',
        hasPages: modelJson.pages ? modelJson.pages.length : 0,
        hasElements: modelJson.pages && modelJson.pages[0] ? modelJson.pages[0].elements?.length : 0
      });
      
      // Register custom questions before creating Model
      // This ensures custom question types are recognized
      const normalizedBrand = normalizeBrand(event.brand);
      // Convert to lowercase for Brand type
      const brandForRegistration = normalizedBrand.toLowerCase() as 'ford' | 'lincoln' | 'unbranded';
      console.log('[Upload] Registering questions for brand:', brandForRegistration);
      registerUniversalQuestions(brandForRegistration, 'backend', true); // Force registration to ensure it happens
      
      model = new Model(modelJson);
      // DO NOT set model.data - the mappers use surveyData directly
      
      console.log('[Upload] Model created, questions count:', model.getAllQuestions().length);
      console.log('[Upload] First question details:', model.getAllQuestions()[0] ? {
        name: model.getAllQuestions()[0].name,
        type: model.getAllQuestions()[0].getType(),
        hasFFSProperty: model.getAllQuestions()[0].hasOwnProperty('_ffs'),
        ffsValue: (model.getAllQuestions()[0] as any)._ffs
      } : 'No questions');
    }
    if (!model) {
      return {
        success: false,
        error: 'No survey model available'
      };
    }

    const brand = normalizeBrand(event.brand);
    
    // Ensure device_survey_guid exists
    if (!surveyData.device_survey_guid) {
      surveyData.device_survey_guid = uuidv4();
    }

    if (brand === 'Ford' && event.fordEventID) {
      return await uploadToFordAPI(model, surveyData, event);
    } else if (brand === 'Lincoln' && event.lincolnEventID) {
      return await uploadToLincolnAPI(model, surveyData, event);
    } else {
      return {
        success: false,
        error: `Invalid brand or missing event ID: ${brand}`
      };
    }
  } catch (error: unknown) {
    console.error('Survey upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
}

/**
 * Upload survey to Ford API
 */
async function uploadToFordAPI(
  surveyModel: Model,
  surveyData: SurveyData,
  event: MeridianEvent
): Promise<UploadResult> {
  console.log('[Ford Upload] Starting Ford API submission process');
  console.log('[Ford Upload] Event ID:', event.fordEventID);
  
  // Map survey data to Ford format
  const fordSurvey = mapToFordPayload(surveyModel, surveyData, event);
  console.log('[Ford Upload] Mapped survey data:', JSON.stringify(fordSurvey, null, 2));
  
  // Merge fordSurvey with surveyData to ensure all expected fields are present
  const mergedSurveyData: Record<string, unknown> = { ...fordSurvey, ...surveyData };
  
  // Ensure microsite_email_template is present (even if null)
  if (!mergedSurveyData.microsite_email_template) {
    mergedSurveyData.microsite_email_template = null;
  }
  
  // Include voi and vehicles_driven arrays directly in the payload if present
  const fordSurveyRecord = fordSurvey as unknown as Record<string, unknown>;
  if (Array.isArray(fordSurveyRecord.voi) && fordSurveyRecord.voi.length) {
    mergedSurveyData.voi = fordSurveyRecord.voi;
  }
  
  if (Array.isArray(fordSurveyRecord.vehiclesDriven) && fordSurveyRecord.vehiclesDriven.length) {
    mergedSurveyData['vehicles_driven'] = fordSurveyRecord.vehiclesDriven;
  }
  
  // Log signature fields for debugging
  console.log('[Ford Upload] Signature fields:', {
    signature: mergedSurveyData.signature,
    minor_signature: mergedSurveyData.minor_signature,
    signature_type: typeof mergedSurveyData.signature,
    minor_signature_type: typeof mergedSurveyData.minor_signature
  });
  
  // Log vehicle data if present
  if (mergedSurveyData.voi || mergedSurveyData['vehicles_driven']) {
    console.log('[Ford Upload] Vehicle data:', {
      voi: mergedSurveyData.voi,
      vehicles_driven: mergedSurveyData['vehicles_driven']
    });
  }
  
  const fordPayload = { surveyCollection: [mergedSurveyData] };
  console.log('[Ford Upload] Final payload:', fordPayload);

  // Upload to Ford API (v10 endpoint)
  const environment = getCurrentEnvironment();
  const fordUrl = getFordApiUrl(environment, FORD_ENDPOINTS.SURVEY_UPLOAD_V10);
  console.log('[Ford Upload] API URL:', fordUrl);
  console.log('[Ford Upload] Environment:', environment);
  
  const fordRes = await axios.post(fordUrl, fordPayload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': FORD_AUTH_TOKEN,
    },
  });

  console.log('[Ford Upload] Response:', fordRes.data);

  return { success: true };
}


/**
 * Upload survey to Lincoln API
 */
async function uploadToLincolnAPI(
  surveyModel: Model,
  surveyData: SurveyData,
  event: MeridianEvent
): Promise<UploadResult> {
  console.log('[Lincoln Upload] Starting Lincoln API submission process');
  console.log('[Lincoln Upload] Event ID:', event.lincolnEventID);
  
  // Map survey data to Lincoln format
  const lincolnSurvey = mapToLincolnPayload(surveyModel, surveyData, event);
  console.log('[Lincoln Upload] Mapped survey data:', JSON.stringify(lincolnSurvey, null, 2));
  
  // Merge lincolnSurvey with surveyData to ensure all expected fields are present
  // IMPORTANT: lincolnSurvey already has pre_drive_survey_guid set to null from createDefaultLincolnPayload()
  const mergedLincolnSurveyData: Record<string, unknown> = { ...lincolnSurvey, ...surveyData };
  
  // Ensure microsite_email_template is present (even if null)
  if (!mergedLincolnSurveyData.microsite_email_template) {
    mergedLincolnSurveyData.microsite_email_template = null;
  }
  
  // IMPORTANT: pre_drive_survey_guid is already set to null from createDefaultFordSurvey()
  // The Lincoln API requires this field to be present, even if null for pre-TD surveys
  // For post-TD surveys it should have a valid guid value
  // DO NOT delete this field!
  
  // Include voi and vehicles_driven arrays directly in the payload if present
  const lincolnSurveyRecord = lincolnSurvey as unknown as Record<string, unknown>;
  if (Array.isArray(lincolnSurveyRecord.voi) && lincolnSurveyRecord.voi.length) {
    mergedLincolnSurveyData.voi = lincolnSurveyRecord.voi;
  }
  
  if (Array.isArray(lincolnSurveyRecord.vehiclesDriven) && lincolnSurveyRecord.vehiclesDriven.length) {
    mergedLincolnSurveyData['vehicles_driven'] = lincolnSurveyRecord.vehiclesDriven;
  }
  
  // Log signature fields for debugging
  console.log('[Lincoln Upload] Signature fields:', {
    signature: mergedLincolnSurveyData.signature,
    minor_signature: mergedLincolnSurveyData.minor_signature,
    signature_type: typeof mergedLincolnSurveyData.signature,
    minor_signature_type: typeof mergedLincolnSurveyData.minor_signature
  });
  
  // Log vehicle data if present
  if (mergedLincolnSurveyData.voi || mergedLincolnSurveyData['vehicles_driven']) {
    console.log('[Lincoln Upload] Vehicle data:', {
      voi: mergedLincolnSurveyData.voi,
      vehicles_driven: mergedLincolnSurveyData['vehicles_driven']
    });
  }
  
  const lincolnPayload = [mergedLincolnSurveyData];
  console.log('[Lincoln Upload] Final payload:', lincolnPayload);
  console.log('[Lincoln Upload] Final payload JSON:', JSON.stringify(lincolnPayload, null, 2));
  
  // Check if pre_drive_survey_guid exists in the final payload
  if ('pre_drive_survey_guid' in lincolnPayload[0]) {
    console.error('[Lincoln Upload] WARNING: pre_drive_survey_guid still present in payload with value:', lincolnPayload[0].pre_drive_survey_guid);
  }
  
  // Critical: Check for string "undefined" values which are different from actual undefined
  const checkForStringUndefined = (obj: Record<string, unknown>) => {
    for (const key in obj) {
      if (obj[key] === "undefined" || obj[key] === "null") {
        console.error(`[Lincoln Upload] CRITICAL: Field '${key}' has string value '${String(obj[key])}' - this should be null or removed!`);
      }
    }
  };
  checkForStringUndefined(lincolnPayload[0]);
  
  // Log specific critical fields for debugging
  console.log('[Lincoln Upload] Critical fields check:', {
    has_pre_drive_survey_guid: 'pre_drive_survey_guid' in lincolnPayload[0],
    pre_drive_survey_guid_value: lincolnPayload[0].pre_drive_survey_guid,
    pre_drive_survey_guid_type: typeof lincolnPayload[0].pre_drive_survey_guid,
    survey_type: lincolnPayload[0].survey_type,
    event_id: lincolnPayload[0].event_id,
  });

  // Upload to Lincoln API
  const environment = getCurrentEnvironment();
  const lincolnUrl = getLincolnApiUrl(environment, LINCOLN_ENDPOINTS.SURVEY_UPLOAD_V13);
  console.log('[Lincoln Upload] API URL:', lincolnUrl);
  console.log('[Lincoln Upload] Environment:', environment);
  
  const lincolnRes = await axios.post(lincolnUrl, lincolnPayload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINCOLN_AUTH_TOKEN,
    },
  });

  console.log('[Lincoln Upload] Response:', lincolnRes.data);

  return { success: true };
}
