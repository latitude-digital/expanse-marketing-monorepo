// Lincoln survey payload type and utility for constructing default Lincoln survey payloads

export interface LincolnSurveyPayload {
  // Required fields per Lincoln API v13
  event_id: number | string | null;
  survey_date: string | Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;
  // Arrays expected by v13 payload
  voi?: (number | string)[] | null;
  vehicles_driven?: (number | string)[] | null;
  age_bracket: string | null;
  gender: string | null;
  how_familiar_other: string | null;
  how_familiar: string | null;
  impression: string | null;
  impression_pre: string | null;
  impression_pre_navigator: string | null;
  impression_post: string | null;
  impression_post_navigator: string | null;
  impression_other: string | null;
  competitive_make: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_purchasing_other: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_pre: string | null;
  how_likely_recommend_post: string | null;
  how_likely_recommend_other: string | null;
  vehicle_driven_most_model_id: number | string | null;
  vehicle_driven_most_year: number | string | null;
  in_market_timing: string | null;
  most_likely_buy_model_id: string | null;
  most_likely_buy_model_id_pre: string | null;
  most_likely_buy_model_id_post: string | null;
  signature: string | null;
  minor_signature: string | null;
  rep_initials: string | null;
  drove_bonus_vehicle: string | null;
  user_name: string | null;
  custom_data: string | null;
  melissa_data_complete: string | null;
  melissa_data_response: string | null;
  device_name: string | null;
  one_word_impression: string | null;
  brand_impression_changed: string | null;
  language: string;
  survey_source: string | null;
}

export function createDefaultLincolnPayload(): LincolnSurveyPayload {
  return {
    // Required fields per Lincoln API v13
    event_id: null,
    survey_date: null,
    survey_type: null,
    device_survey_guid: null,
    pre_drive_survey_guid: null,
    device_id: null,
    app_version: 'expanse_2.0',
    abandoned: 0,
    start_time: null,
    end_time: null,
    first_name: null,
    last_name: null,
    address1: null,
    address2: null,
    city: null,
    state: null,
    country_code: null,
    zip_code: null,
    phone: null,
    email: null,
    email_opt_in: 0,
    age_bracket: null,
    gender: null,
    how_familiar_other: null,
    how_familiar: null,
    impression: null,
    impression_pre: null,
    impression_pre_navigator: null,
    impression_post: null,
    impression_post_navigator: null,
    impression_other: null,
    competitive_make: null,
    how_likely_purchasing: null,
    how_likely_purchasing_pre: null,
    how_likely_purchasing_post: null,
    how_likely_purchasing_other: null,
    how_likely_recommend: null,
    how_likely_recommend_pre: null,
    how_likely_recommend_post: null,
    how_likely_recommend_other: null,
    vehicle_driven_most_model_id: null,
    vehicle_driven_most_year: null,
    in_market_timing: null,
    most_likely_buy_model_id: null,
    most_likely_buy_model_id_pre: null,
    most_likely_buy_model_id_post: null,
    signature: null,
    minor_signature: null,
    rep_initials: null,
    drove_bonus_vehicle: null,
    user_name: null,
    custom_data: null,
    melissa_data_complete: null,
    melissa_data_response: null,
    device_name: null,
    one_word_impression: null,
    brand_impression_changed: null,
    language: 'en',
    survey_source: null,
  };
}
