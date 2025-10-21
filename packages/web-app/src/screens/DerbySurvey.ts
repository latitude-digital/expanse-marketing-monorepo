// @ts-nocheck
import { ITheme } from "survey-core";

// SurveyJS Survey Configuration Types
interface SurveyChoice {
  value: string;
  text: string;
}

interface LocalizedString {
  en?: string;
  es?: string;
  fr?: string;
  default?: string;
}

interface SurveyElement {
  type: string;
  name: string;
  title?: string | LocalizedString;
  description?: string | LocalizedString;
  descriptionLocation?: string;
  titleLocation?: string;
  isRequired?: boolean;
  requiredIf?: string;
  visibleIf?: string;
  startWithNewLine?: boolean;
  _ffs?: string;
  renderAs?: string;
  choices?: (string | SurveyChoice)[];
  choicesOrder?: string;
  hideNumber?: boolean;
  autoGenerate?: boolean;
  rateValues?: SurveyChoice[];
  minRateDescription?: string;
  maxRateDescription?: string;
  validators?: Array<{ type: string; }>;
  didYouMeanQuestion?: LocalizedString;
  showNoneItem?: boolean;
  noneText?: string;
  elements?: SurveyElement[];
}

interface SurveyPage {
  name: string;
  elements: SurveyElement[];
}

interface SurveySurveyConfiguration {
  title: string;
  showTitle: boolean;
  completedHtml: string;
  focusFirstQuestionAutomatic: boolean;
  showQuestionNumbers: string;
  autoGrowComment: boolean;
  startSurveyText: string;
  completeText: string;
  widthMode: string;
  fitToContainer: boolean;
  headerView: string;
  checkErrorsMode: string;
  textUpdateMode: string;
  pages: SurveyPage[];
}

export const themeOverride: ITheme = {
  "header": {
      "height": 400,
      "mobileHeight": 200,
      "inheritWidthFrom": "survey",
      "textAreaWidth": 0,
      "backgroundImage": "https://assets.expansemarketing.com/events/2025_Lions_VS_Dolphins_Pride_Plaza/1754691208844-3424_Ford_Lions_header_Latitude_V01.png",
      "backgroundImageFit": "contain",
      "backgroundImageOpacity": 100,
      "overlapEnabled": false,
      "logoPositionX": "left",
      "logoPositionY": "top",
      "titlePositionX": "left",
      "titlePositionY": "bottom",
      "descriptionPositionX": "left",
      "descriptionPositionY": "bottom"
  },
  "headerView": "advanced"
}


export const baseSurvey: SurveySurveyConfiguration = {
  title: '2025 Kentucky Derby',
  showTitle: false,
  completedHtml: '<h3>Thank you for your participation.</h3>',
  focusFirstQuestionAutomatic: false,
  showQuestionNumbers: 'off',
  autoGrowComment: true,
  startSurveyText: 'Begin',
  completeText: 'Finish',
  widthMode: 'responsive',
  fitToContainer: true,
  headerView: 'advanced',
  checkErrorsMode: 'onComplete',
  textUpdateMode: 'onBlur',
  pages: [
    {
      name: 'page1',
      elements: [
        {
          type: 'panel',
          name: 'panel4',
          elements: [
            {
              type: 'radiogroup',
              name: 'ageBracket',
              title: 'What age range do you fall into?',
              isRequired: true,
              renderAs: 'radiobuttongroup',
              _ffs: 'age_bracket',
              choices: [
                'Under 18',
                '18 - 20',
                '21 - 24',
                '25 - 29',
                '30 - 34',
                '35 - 39',
                '40 - 44',
                '45 - 49',
                '50 - 59',
                {
                  value: '60+',
                  text: 'Over 60'
                }
              ]
            },
            {
              type: 'gender',
              name: 'gender',
              _ffs: 'gender',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'firstname',
              name: 'first_name',
              _ffs: 'firstName',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'lastname',
              name: 'last_name',
              _ffs: 'lastName',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              startWithNewLine: false,
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'autocompleteaddress',
              name: 'address_group',
              _ffs: 'address_group',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'email',
              name: 'email',
              _ffs: 'email',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'phone',
              name: 'phone',
              _ffs: 'phone',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              startWithNewLine: false,
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'fordoptin',
              name: 'fordEmailOptIn',
              _ffs: 'emailOptIn',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'html',
              name: 'question_header',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              html: '<p style="font-weight: 600; margin: 20px 0 10px 0;">Please indicate how well each idea describes Ford on a scale of 1-5 (1 - Strongly Disagree, 5 - Strongly Agree).</p>'
            },
            {
              type: 'fordpassion',
              name: 'passion',
              _ffs: 'custom.passion',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'fordcapability',
              name: 'capability',
              _ffs: 'custom.capability',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'vehicledrivenmostmake',
              name: 'vehicleDrivenMostMake',
              _ffs: 'vehicle_driven_most_make_id',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'inmarkettiming',
              name: 'inMarketTiming',
              _ffs: 'in_market_timing',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              requiredIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'fordvoi',
              name: 'fordVOI',
              _ffs: 'voi',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
            },
            {
              type: 'checkbox',
              name: 'ethnicity',
              visibleIf:
                "{ageBracket} <> 'Under 18' and {ageBracket} notempty and {address_group.state} <> 'MD' and {address_group.state} notempty",
              title:
                'Please select the following race(s) in which you would place yourself (select all that apply).',
              _ffs: 'custom.ethnicity',
              choices: [
                'White',
                'Hispanic',
                'Black, African American',
                'Asian',
                'Other'
              ],
              showNoneItem: true,
              noneText: 'Prefer not to answer'
            }
          ]
        }
      ]
    }
  ]
};

export const incentiveThanks: string = `
  <div style="background: #fff; padding: 24px; text-align: center; margin: 0 0 24px 0;">
    <h3>Thank You for participating in this Ford event</h3>
    <p>Please show this QR code to one of the attendants to show you completed the survey</p>
    <div style="display: flex; justify-content: center;">
      <div style="position: relative; width: 200px; height: 200px;">
        <img alt="{device_survey_guid}" src="https://pfg.latitudewebservices.com/microsite/v1/events/qr?str={device_survey_guid}" style="width: 200px; height: 200px; display: block;" />
        <img alt="Ford" style="height: 40px; position: absolute; left: 50%; top: 50%; z-index: 2; transform: translate(-50%, -50%);" src="https://cdn.latitudewebservices.com/expanse_marketing/2024/ford/ford_logo.png" />
      </div>
    </div>
  </div>
`;

export const activationThanks: string = `
  <div style="background: #fff; padding: 24px; text-align: center; margin: 0 0 24px 0;">
    <h3>Thank You for registering with Ford Motor Company</h3>
    <p>Use this QR Code at other Ford activities at this event</p>
    <div style="display: flex; justify-content: center;">
      <div style="position: relative; width: 200px; height: 200px;">
        <img alt="{device_survey_guid}" src="https://pfg.latitudewebservices.com/microsite/v1/events/qr?str={device_survey_guid}" style="width: 200px; height: 200px; display: block;" />
        <img alt="Ford" style="height: 40px; position: absolute; left: 50%; top: 50%; z-index: 2; transform: translate(-50%, -50%);" src="https://cdn.latitudewebservices.com/expanse_marketing/2024/ford/ford_logo.png" />
      </div>
    </div>
  </div>
`;

// Export types for use in other files
export type { SurveySurveyConfiguration, SurveyPage, SurveyElement, LocalizedString, SurveyChoice };
// @ts-nocheck
