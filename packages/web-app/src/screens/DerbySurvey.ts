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
  checkErrorsMode: 'onValueChanged',
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
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'Gender?',
                es: 'Sexo',
                fr: 'Genre',
                default: 'Select Gender'
              },
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              validators: [
                {
                  type: 'expression'
                }
              ],
              _ffs: 'gender'
            },
            {
              type: 'firstname',
              name: 'first_name',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'First Name',
                es: 'Nombre',
                fr: 'Prénom'
              },
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'first_name'
            },
            {
              type: 'lastname',
              name: 'last_name',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              startWithNewLine: false,
              title: {
                en: 'Last Name',
                es: 'Apellidos',
                fr: 'Nom de famille'
              },
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'last_name'
            },
            {
              type: 'autocompleteaddress',
              name: 'address_group',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              titleLocation: 'hidden',
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'address_group'
            },
            {
              type: 'email',
              name: 'email',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'Email Address',
                es: 'Correo electrónico',
                fr: 'Email'
              },
              description:
                "Ford Motor Company respects your privacy and treats your personal information with care. [Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)",
              descriptionLocation: 'underInput',
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'email',
              didYouMeanQuestion: {
                en: 'Did you mean %s?',
                es: '¿Quisiste decir %s?',
                fr: 'Vouliez-vous dire %s?'
              }
            },
            {
              type: 'phone',
              name: 'phone',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              startWithNewLine: false,
              title: {
                en: 'Mobile Number',
                es: 'Teléfono',
                fr: 'Téléphone'
              },
              description: {
                en: 'Standard message and data rates may apply.',
                es: 'Pueden aplicar las tarifas normales para mensajes de texto y datos.',
                fr: "Les tarifs standard pour les messages et les données peuvent s'appliquer."
              },
              descriptionLocation: 'underInput',
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'phone'
            },
            {
              type: 'fordoptin',
              name: 'fordEmailOptIn',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'Please email me communications including product information, offers, and incentives from Ford Motor Company and the local dealer.',
                es: 'Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Ford Motor Company y sus concesionarios.',
                fr: 'Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Ford Motor Company et de son concessionnaire.'
              },
              description: {
                en: "Ford Motor Company respects your privacy and treats your personal information with care. [Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)",
                es: 'Ford Motor Company respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Ford Motor Company.](https://es.ford.com/help/privacy/)',
                fr: 'Ford Motor Company respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Ford Motor Company.](https://ford.com/help/privacy/)'
              },
              descriptionLocation: 'underInput',
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'emailOptIn'
            },
            {
              type: 'html',
              name: 'question_header',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              html: '<p style="font-weight: 600; margin: 20px 0 10px 0;">Please indicate how well each idea describes Ford on a scale of 1-5 (1 - Strongly Disagree, 5 - Strongly Agree).</p>'
            },
            {
              type: 'rating',
              name: 'passion',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: 'Ford is a brand that helps me do the things I love.',
              hideNumber: true,
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'custom.passion',
              autoGenerate: false,
              rateValues: [
                { value: 'A', text: '1' },
                { value: 'B', text: '2' },
                { value: 'C', text: '3' },
                { value: 'D', text: '4' },
                { value: 'E', text: '5' }
              ],
              minRateDescription: 'Strongly Disagree',
              maxRateDescription: 'Strongly Agree'
            },
            {
              type: 'rating',
              name: 'capability',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title:
                'Ford is a brand that helps me feel capable and confident.',
              hideNumber: true,
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'custom.capability',
              autoGenerate: false,
              rateValues: [
                { value: 'A', text: '1' },
                { value: 'B', text: '2' },
                { value: 'C', text: '3' },
                { value: 'D', text: '4' },
                { value: 'E', text: '5' }
              ],
              minRateDescription: 'Strongly Disagree',
              maxRateDescription: 'Strongly Agree'
            },
            {
              type: 'vehicledrivenmostmake',
              name: 'vehicleDrivenMostMake',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'What vehicle do you drive most often?',
                es: '¿Qué vehículo conduces con mayor frecuencia?',
                fr: 'Quel véhicule conduisez-vous le plus souvent?',
                default: 'What is your current vehicle make?'
              },
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'vehicle_driven_most_make_id'
            },
            {
              type: 'inmarkettiming',
              name: 'inMarketTiming',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'When do you plan to acquire your next vehicle?',
                es: '¿Cuándo piensas adquirir tu próximo vehículo?',
                fr: "Quand prévoyez-vous d'acheter votre prochain véhicule?",
                default: 'When do you plan to acquire your next new vehicle?'
              },
              isRequired: true,
              requiredIf: "{ageBracket} <> 'Under 18'",
              _ffs: 'in_market_timing'
            },
            {
              type: 'fordvoi',
              name: 'fordVOI',
              visibleIf: "{ageBracket} <> 'Under 18' and {ageBracket} notempty",
              title: {
                en: 'I am interested in receiving more information on the following vehicles.',
                es: 'Me interesaría recibir más información sobre los siguientes vehículos.',
                fr: "Je suis intéressé à recevoir plus d'informations sur les véhicules suivants.",
                default: 'Which vehicle(s) are you interested in?'
              },
              description: {
                en: 'You may select up to three models.',
                es: 'Puede seleccionar hasta tres modelos.',
                fr: "Vous pouvez sélectionner jusqu'à trois modèles."
              },
              _ffs: 'voi',
              choicesOrder: 'asc'
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
export type { SurveySurveyConfiguration, SurveyPage, SurveyElement, LocalizedString, SurveyChoice };