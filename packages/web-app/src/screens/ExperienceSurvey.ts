// @ts-nocheck
// Import shared types from DerbySurvey
import type { SurveySurveyConfiguration, SurveyChoice } from './DerbySurvey';

// Extended interfaces for ExperienceSurvey specific features
interface ExperienceSurveyConfiguration extends Omit<SurveySurveyConfiguration, 'logo' | 'logoWidth' | 'logoHeight' | 'logoPosition'> {
  logo?: string;
  logoWidth?: string;
  logoHeight?: string;
  logoPosition?: string;
}

interface ValidatorConfig {
  type: string;
  text?: string;
  expression?: string;
}

interface AddressAutocompleteConfig {
  addressPartMap: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface ChoicesByUrlConfig {
  url: string;
  valueName: string;
  titleName: string;
  image: string;
}

// Extended element interface for ExperienceSurvey specific fields
interface ExperienceSurveyElement {
  type: string;
  name: string;
  title?: string;
  description?: string;
  descriptionLocation?: string;
  titleLocation?: string;
  isRequired?: boolean;
  requiredIf?: string;
  requiredErrorText?: string;
  visibleIf?: string;
  startWithNewLine?: boolean;
  inputType?: string;
  autocomplete?: string;
  valueName?: string;
  maxLength?: string;
  validators?: ValidatorConfig[];
  html?: string;
  renderAs?: string;
  buttonSize?: string;
  choices?: (string | SurveyChoice)[];
  inputMask?: string;
  inputFormat?: string;
  addressAutocompleteConfig?: AddressAutocompleteConfig;
  maxSelectedChoices?: number;
  choicesByUrl?: ChoicesByUrlConfig;
  elements?: ExperienceSurveyElement[];
}

interface ExperienceSurveyPage {
  name: string;
  elements: ExperienceSurveyElement[];
}

export const baseSurvey: ExperienceSurveyConfiguration = {
  title: 'Ford Experience Survey',
  completedHtml: '<h3>Thank you for your participation.</h3>',
  focusFirstQuestionAutomatic: false,
  // "cookieName": "1e985076-2794-463a",
  showQuestionNumbers: 'off',
  autoGrowComment: true,
  startSurveyText: 'Begin',
  completeText: 'Finish',
  widthMode: 'responsive',
  fitToContainer: true,
  headerView: 'advanced',
  checkErrorsMode: 'onValueChanged',
  textUpdateMode: 'onBlur',
  showTitle: false, // Adding required field from base interface
  pages: [
    {
      name: 'basicSurvey',
      elements: [
        {
          type: 'panel',
          name: 'nameAddress',
          elements: [
            {
              type: 'firstname',
              name: 'first_name',
              title: 'First Name',
              isRequired: true,
              autocomplete: 'given-name'
            },
            {
              type: 'lastname',
              name: 'last_name',
              startWithNewLine: false,
              title: 'Last Name',
              isRequired: true,
              autocomplete: 'family-name'
            },
            {
              type: 'autocompleteaddress',
              name: 'address_group',
              title: 'Address',
              isRequired: true
            },
            {
              type: 'email',
              name: 'email',
              title: 'Email Address',
              requiredIf: '{phone} empty',
              requiredErrorText: 'Either Email Or Phone Is Required',
              autocomplete: 'email',
              validators: [
                {
                  type: 'email'
                },
                {
                  type: 'expression',
                  text: 'Please enter a valid e-mail address.',
                  expression: 'validateEmail({email})'
                }
              ]
            },
            {
              type: 'phone',
              name: 'phone',
              startWithNewLine: false,
              title: 'Mobile Number',
              description: 'Standard message and data rates may apply',
              descriptionLocation: 'underInput',
              requiredIf: '{email} empty',
              requiredErrorText: 'Either Email Or Phone Is Required',
              autocomplete: 'tel',
              inputMask: 'phone',
              inputFormat: '999-999-9999'
            },
            {
              type: 'html',
              name: 'privacy',
              html: '<p style="font-size:0.7em;line-height:1.5em;">Ford Motor Company respects your privacy and treats your personal information with care.<br/><a href="https://www.ford.com/help/privacy/" target="_blank">Click here to read Ford Motor Company\'s privacy policy.</a></p>'
            },
            {
              type: 'radiogroup',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              name: 'accepts_sms',
              title: 'Please send me vehicle information via text message.',
              isRequired: true,
              _ffs: 'accepts_sms',
              choices: [
                {
                  value: 1,
                  text: 'Yes'
                },
                {
                  value: 0,
                  text: 'No'
                }
              ]
            },
            {
              type: 'fordrecommend',
              name: 'how_likely_recommend',
              renderAs: 'radiobuttongroup',
              buttonSize: 'large',
              title:
                'How likely are you to recommend Ford to a friend, relative or colleague?',
              isRequired: true,
              choices: [
                'Definitely Will NOT Recommend',
                'Probably Will NOT Recommend',
                'Maybe Will / Maybe Will Not Recommend',
                'Probably Will Recommend',
                'Definitely Will Recommend'
              ]
            },
            {
              type: 'fordoptin',
              name: 'email_opt_in',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              title:
                'Please email me communications including product information, offers, and incentives from Ford Motor Company and the local dealer.',
              isRequired: true,
              choices: [
                {
                  value: 1,
                  text: 'Yes'
                },
                {
                  value: 0,
                  text: 'No'
                }
              ]
            }
          ]
        },
        {
          type: 'panel',
          name: 'baseQuestions',
          elements: [
            {
              type: 'gender',
              name: 'gender',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              title: 'Gender',
              isRequired: true,
              choices: [
                {
                  value: 'male',
                  text: 'Male'
                },
                {
                  value: 'female',
                  text: 'Female'
                },
                {
                  value: 'noAnswer',
                  text: 'Prefer Not to Answer'
                }
              ]
            },
            {
              type: 'agebracket',
              name: 'age_bracket',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              title: 'May I ask your age?',
              isRequired: true,
              choices: [
                '18 to 24',
                '25 to 29',
                '30 to 34',
                '35 to 39',
                '40 to 44',
                '45 to 49',
                '50 to 59',
                'Over 60'
              ]
            },
            {
              type: 'radiogroup',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              name: 'current_owner',
              title: 'Are you currently a Ford owner?',
              isRequired: true,
              _ffs: 'current_owner',
              choices: [
                {
                  value: 1,
                  text: 'Yes'
                },
                {
                  value: 0,
                  text: 'No'
                }
              ]
            },
            {
              type: 'radiogroup',
              renderAs: 'radiobuttongroup',
              buttonSize: 'large',
              name: 'ford_model',
              visibleIf: '{current_owner} = 1',
              title: 'Which model of Ford do you drive most often?',
              isRequired: true,
              _ffs: 'ford_model',
              choices: [
                'Bronco',
                'Bronco Sport',
                'Edge',
                'Escape',
                'Expedition',
                'Explorer',
                'F-150',
                'F-150 Lightning',
                'Ford GT',
                'Maverick',
                'Mustang',
                'Mustang Mach-E',
                'Ranger',
                'Super Duty',
                'Transit',
                'Other'
              ]
            },
            {
              type: 'radiogroup',
              renderAs: 'radiobuttongroup',
              buttonSize: 'large',
              name: 'brand_for_me',
              title:
                'How much do you agree or disagree with the statement "Ford is a brand for me"?',
              isRequired: true,
              _ffs: 'brand_for_me',
              choices: [
                'Completely Disagree',
                'Somewhat Disagree',
                'Neither Agree or Disagree',
                'Somewhat Agree',
                'Completely Agree'
              ]
            },
            {
              type: 'howlikelyacquire',
              name: 'how_likely_acquire',
              renderAs: 'radiobuttongroup',
              buttonSize: 'medium',
              title: 'How do you plan to acquire your next vehicle?',
              isRequired: true,
              choices: ['Purchase', 'Lease']
            },
            {
              type: 'radiogroup',
              renderAs: 'radiobuttongroup',
              buttonSize: 'large',
              name: 'how_likely_purchasing',
              title:
                'The next time you are shopping for an automotive vehicle, how likely are you to consider a Ford?',
              isRequired: true,
              _ffs: 'how_likely_purchasing',
              choices: [
                'Definitely Will NOT Consider',
                'Probably Will NOT Consider',
                'Maybe Will / Maybe Will NOT Consider',
                'Probably Will Consider',
                'Definitely Will Consider'
              ]
            },
            {
              type: 'inmarkettiming',
              name: 'in_market_timing',
              renderAs: 'radiobuttongroup',
              buttonSize: 'large',
              title: 'When do you plan to acquire your next vehicle?',
              isRequired: true,
              choices: [
                '0-30 Days',
                '1-3 Months',
                '4-6 Months',
                '7+ Months',
                'No Definite Plans'
              ]
            },
            {
              type: 'fordvoi',
              name: 'voi',
              renderAs: 'voi',
              title:
                'I am interested in learning more about the following Ford vehicles.',
              description: 'You may select up to three models.',
              maxSelectedChoices: 3,
              choicesByUrl: {
                url: 'https://cdn.latitudewebservices.com/vehicles/ford.json',
                valueName: 'id',
                titleName: 'name',
                image: 'image'
              }
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
    <div></div>
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
    <div></div>
  </div>
`;

// Export types for use in other files
export type { ExperienceSurveyConfiguration, ExperienceSurveyElement, ExperienceSurveyPage, ValidatorConfig, AddressAutocompleteConfig, ChoicesByUrlConfig };
// @ts-nocheck
