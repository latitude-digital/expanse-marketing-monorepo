type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX;

type LatitudeAPIResponse = {
  success: boolean;
  message: string;
  surveyID?: string;
  event?: any;
  error?: any;
};

type EmailDefinition = {
  template: string;
  daysBefore?: number;
  daysAfter?: number;
  sendNow?: boolean;
  sendNowAfterDays?: number;
  customData?: any;
  sendHour?: number;
};

type AutoCheckOutDefinition = {
  minutesAfter: number;
  postEventId: string;
};

type ExpanseEvent = {
  id: string;
  fordEventID?: number;
  lincolnEventID?: number;
  surveyType?: "basic" | "preTD" | "postTD";
  _preEventID?: string;
  checkInDisplay?: Record<string, string>;
  confirmationEmail?: EmailDefinition;
  disabled?: string;
  preRegDate?: Date;
  startDate: Date;
  endDate: Date;
  name: string;
  questions: ISurvey;
  reminderEmail?: EmailDefinition;
  thankYouEmail?: EmailDefinition;
  autoCheckOut?: AutoCheckOutDefinition;
  checkOutEmail?: EmailDefinition;
  thanks?: string;
  theme: IExtendedTheme | ITheme;
  survey_count_limit?: number;
  limit_reached_message?: string;
};
