// FordSurvey type and utility for constructing default FordSurvey objects for v11 endpoint

export interface FordSurvey {
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
  vehicle_driven_most_model_id: number | string | null;
  vehicle_driven_most_make_id: number | string | null;
  vehicle_driven_most_year: number | string | null;
  in_market_timing: string | null;
  accepts_sms: number;
  how_likely_acquire: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_post: string | null;
  followup_survey_opt_in: string | null;
  signature: string | null;
  minor_signature: string | null;
  birth_year: string | number | null;
  gender: string | null;
  age_bracket: string | null;
  impression_pre: string | null;
  impression_ev: string | null;
  can_trust: string | null;
  impact_overall_opinion: string | null;
  optins: any[];
  custom_data: string | null;
}

export function createDefaultFordSurvey(): FordSurvey {
  return {
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
    vehicle_driven_most_model_id: null,
    vehicle_driven_most_make_id: null,
    vehicle_driven_most_year: null,
    in_market_timing: null,
    accepts_sms: 0,
    how_likely_acquire: null,
    how_likely_purchasing: null,
    how_likely_purchasing_pre: null,
    how_likely_purchasing_post: null,
    how_likely_recommend: null,
    how_likely_recommend_post: null,
    followup_survey_opt_in: null,
    signature: null,
    minor_signature: null,
    birth_year: null,
    gender: null,
    age_bracket: null,
    impression_pre: null,
    impression_ev: null,
    can_trust: null,
    impact_overall_opinion: null,
    optins: [],
    custom_data: null,
  };
}
