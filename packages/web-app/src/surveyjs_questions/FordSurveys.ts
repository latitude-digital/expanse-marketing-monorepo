/**
 * Ford-specific SurveyJS custom question type definitions
 * 
 * ⚠️ IMPORTANT FOR DEVELOPERS:
 * This file defines Ford-specific question types. Unlike Lincoln questions,
 * Ford questions don't have a separate template configuration file.
 * Most _ffs values and properties are set directly here.
 * 
 * For Lincoln questions, see LincolnSurveys.ts + /src/helpers/surveyTemplatesLincoln.ts
 */

import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import {
  ICustomQuestionTypeConfigurationVOI,
} from "./interfaces";
import { handleChoicesByUrl } from "./choicesByUrlHelper";

// Global flag to prevent multiple initialization
let fordQuestionsInitialized = false;

/**
 * Helper to safely set a property as readonly only if it's defined on the specific type
 * This prevents accidentally modifying base type properties which affects ALL questions
 */
const setPropertyReadOnly = (typeName: string, propertyName: string) => {
  const prop = Serializer.findProperty(typeName, propertyName);
  // Only set readonly if the property is defined on this specific type
  // or if it's a custom property like _ffs that we added
  if (prop && (prop.classInfo?.name === typeName || propertyName === "_ffs")) {
    prop.readOnly = true;
  }
};

const fordInit = () => {
  // Prevent multiple initialization
  if (fordQuestionsInitialized) {
    console.log('Ford questions already initialized, skipping...');
    return;
  }

  console.log('Initializing Ford questions for the first time...');
  // Register individual questions to avoid module caching issues
  
  /**
   * Ford Vehicle of Interest (VOI) Question
   * 
   * @description Multi-select checkbox for Ford vehicles the customer is interested in
   * @_ffs "voi" - Maps to voi field in Ford API
   * @api_endpoint VEHICLES_INSERT - Sends selected vehicle_ids to Ford endpoint
   * @max_selections 3 vehicles
   * @data_source https://cdn.latitudewebservices.com/vehicles/ford.json
   */
  // Register fordvoi if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("fordvoi")) {
    console.log('Registering Ford VOI question type...');

  Serializer.addProperty("question", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  ComponentCollection.Instance.add({
    name: "fordvoi",
    title: "Ford VOI",
    iconName: "icon-cars",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.addProperty("fordvoi", {
        name: "onlyInclude",
        displayName: "Only Include these vehicle_ids",
        type: "text",
        category: "general",
        isSerializable: true,
      });
    },
    questionJSON: {
      type: "checkbox",
      name: "voi",
      title: {
        en: "I am interested in receiving more information on the following vehicles.",
        es: "Me interesaría recibir más información sobre los siguientes vehículos.",
        fr: "Je suis intéressé à recevoir plus d'informations sur les véhicules suivants.",
      },
      "description": {
        en: "Select up to 3 Ford vehicles you're interested in learning more about.",
        es: "Seleccione hasta 3 vehículos Ford sobre los que le gustaría obtener más información.",
        fr: "Sélectionnez jusqu'à 3 véhicules Ford qui vous intéressent pour en savoir plus.",
      },
      renderAs: "voi",
      maxSelectedChoices: 3,
      choicesByUrl: {
        url: "https://cdn.latitudewebservices.com/vehicles/ford.json",
        valueName: "id",
        titleName: "name",
        image: "image",
      },
    },
    onLoaded(question: Question) {
      this.updateOnlyInclude(question);
      // Use shared utility to handle choicesByUrl for custom question types
      handleChoicesByUrl(question, 'FordSurveys');
      
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    onPropertyChanged(question: Question, propertyName: string, newValue: any) {
      if (propertyName === "onlyInclude") {
        this.updateOnlyInclude(question);
      }
    },
    updateOnlyInclude(question: Question) {
      const checkbox = question.contentQuestion;
      if (!!checkbox) {
        checkbox.onlyInclude = question.onlyInclude;
      }
    },
  } as ICustomQuestionTypeConfigurationVOI);
  }

  /**
   * Ford Vehicles Driven Question
   * 
   * @description Multi-select checkbox for Ford vehicles actually test driven at event
   * @_ffs "vehiclesDriven" - Maps to vehiclesDriven field
   * @note Ford hasn't implemented the driven endpoint yet (unlike Lincoln)
   * @data_source https://cdn.latitudewebservices.com/vehicles/ford.json
   * @future Will eventually send to Ford vehicles driven endpoint when implemented
   */
  // Register fordvehiclesdriven if it doesn't exist - NEW QUESTION TYPE
  if (!ComponentCollection.Instance.getCustomQuestionByName("fordvehiclesdriven")) {
    console.log('Registering new fordvehiclesdriven question type...');
    ComponentCollection.Instance.add({
      name: "fordvehiclesdriven",
      title: "Ford Vehicles Driven",
      iconName: "icon-cars",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.addProperty("fordvehiclesdriven", {
          name: "onlyInclude",
          displayName: "Only Include these vehicle_ids",
          type: "text",
          category: "general",
          isSerializable: true,
        });
      },
      questionJSON: {
        type: "checkbox",
        name: "vehiclesDriven",
        _ffs: "vehiclesDriven",
        title: {
          en: "Please select the Ford vehicles that you experienced today.",
        },
        description: {
          en: "Please select the vehicles in the order you experienced them.",
        },
        renderAs: "vehiclesdriven",
        choicesByUrl: {
          url: "https://cdn.latitudewebservices.com/vehicles/ford.json",
          valueName: "id",
          titleName: "name",
          image: "image",
        },
      },
      onLoaded(question: Question) {
        this.updateOnlyInclude(question);
        // Use shared utility to handle choicesByUrl for custom question types
        handleChoicesByUrl(question, 'FordSurveys');
        
        // Sync validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child && question.validators?.length > 0) {
          child.validators = [...(child.validators || []), ...question.validators];
          child.isRequired = true;
        }
      },
      onPropertyChanged(question: Question, propertyName: string, newValue: any) {
        if (propertyName === "onlyInclude") {
          this.updateOnlyInclude(question);
        }
      },
      updateOnlyInclude(question: Question) {
        const checkbox = question.contentQuestion;
        if (!!checkbox) {
          checkbox.onlyInclude = question.onlyInclude;
        }
      },
    } as ICustomQuestionTypeConfigurationVOI);
  }

  /**
   * Ford Email Opt-In Question
   * 
   * @description Radio button group for Ford email marketing consent
   * @_ffs "email_opt_in" - Maps to email_opt_in field in Ford API (1=Yes, 0=No)
   * @privacy_policy Includes Ford Motor Company privacy policy link
   * @required true
   */
  // Register other Ford questions if they don't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("fordoptin")) {
    console.log('Registering Ford optin question type...');
    ComponentCollection.Instance.add({
    name: "fordoptin",
    title: "Ford Opt-In",
    iconName: "icon-thumbs-up",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "Please email me communications including product information, offers, and incentives from Ford Motor Company and the local dealer.",
        es: "Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Ford Motor Company y sus concesionarios.",
        fr: "Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Ford Motor Company et de son concessionnaire.",
      },
      description: {
        en: "Ford Motor Company respects your privacy and treats your personal information with care. [Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)",
        es: "Ford Motor Company respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Ford Motor Company.](https://es.ford.com/help/privacy/)",
        fr: "Ford Motor Company respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidencialité de Ford Motor Company.](https://ford.com/help/privacy/)",
      },
      descriptionLocation: "underInput",
      isRequired: true,
      renderAs: "radiobuttongroup",
      choices: [
        {
          value: 1,
          text: "Yes",
        },
        {
          value: 0,
          text: "No",
        },
      ],
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
  } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Ford Recommend (Pre-Event) Question
   * 
   * @description 5-point recommendation scale for Ford brand
   * @_ffs "how_likely_recommend" - Maps to how_likely_recommend field in Ford API
   * @scale 1-5 (Definitely Will NOT to Definitely Will Recommend)
   * @when Pre-event (before vehicle experience)
   */
  ComponentCollection.Instance.add({
    name: "fordrecommend",
    title: "How Likely Recommend Ford",
    iconName: "icon-people-arrows",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      setPropertyReadOnly("fordrecommend", "name");
      setPropertyReadOnly("fordrecommend", "_ffs");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "How likely are you to recommend Ford to a friend or colleague?",
        es: "¿Qué tan probable es que recomiende Ford a un amigo o colega?",
        fr: "Quelle est la probabilité que vous recommandiez Ford à un ami ou collègue?",
      },
      renderAs: "radiobuttongroup",
      isRequired: true,
      choices: [
        {
          value: 1,
          text: {
            en: "Definitely Will NOT Recommend",
            es: "Definitivamente NO recomendaré",
            fr: "Je ne recommanderai certainement PAS",
          },
        },
        {
          value: 2,
          text: {
            en: "Probably Will NOT Recommend",
            es: "Probablemente NO recomendaré",
            fr: "Je ne recommanderai probablement PAS",
          },
        },
        {
          value: 3,
          text: {
            en: "Maybe Will / Maybe Will Not Recommend",
            es: "Tal vez recomendaré / Tal vez no recomendaré",
            fr: "Peut-être que je recommanderai / Peut-être que je ne recommanderai pas",
          },
        },
        {
          value: 4,
          text: {
            en: "Probably Will Recommend",
            es: "Probablemente recomendaré",
            fr: "Je recommanderai probablement",
          },
        },
        {
          value: 5,
          text: {
            en: "Definitely Will Recommend",
            es: "Definitivamente recomendaré",
            fr: "Je recommanderai certainement",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);




  /**
   * Ford Purchase Consideration (Pre-Event) Question
   * 
   * @description 5-point scale for Ford vehicle purchase consideration
   * @_ffs "how_likely_purchasing" - Maps to how_likely_purchasing field in Ford API
   * @scale 1-5 (Definitely Will NOT to Definitely Will Consider)
   * @when Pre-event (before vehicle experience)
   */
  ComponentCollection.Instance.add({
    name: "howlikelypurchasingford",
    title: "How Likely to Purchase Ford",
    iconName: "icon-chart-bar",
    showInToolbox: true,
    inheritBaseProps: true,
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "How likely are you to consider purchasing a Ford vehicle?",
        es: "¿Qué tan probable es que consideres comprar un vehículo Ford?",
        fr: "Quelle est la probabilité que vous considériez l'achat d'un véhicule Ford?",
      },
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        {
          value: 1,
          text: {
            en: "Definitely Will NOT Consider",
            es: "Definitivamente NO consideraré",
            fr: "Je ne considérerai certainement PAS",
          },
        },
        {
          value: 2,
          text: {
            en: "Probably Will NOT Consider",
            es: "Probablemente NO consideraré",
            fr: "Je ne considérerai probablement PAS",
          },
        },
        {
          value: 3,
          text: {
            en: "Maybe Will / Maybe Will NOT Consider",
            es: "Tal vez consideraré / Tal vez no consideraré",
            fr: "Peut-être que je considérerai / Peut-être que je ne considérerai pas",
          },
        },
        {
          value: 4,
          text: {
            en: "Probably Will Consider",
            es: "Probablemente consideraré",
            fr: "Je considérerai probablement",
          },
        },
        {
          value: 5,
          text: {
            en: "Definitely Will Consider",
            es: "Definitivamente consideraré",
            fr: "Je considérerai certainement",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);




  /**
   * Ford Recommend (Post-Event) Question
   * 
   * @description 5-point recommendation scale for Ford brand after event
   * @_ffs "how_likely_recommend_post" - Maps to how_likely_recommend_post field in Ford API
   * @scale 1-5 (Definitely Will NOT to Definitely Will Recommend)
   * @when Post-event (after vehicle experience)
   */
  ComponentCollection.Instance.add({
    name: "fordrecommendpost",
    title: "How Likely Recommend Ford (post event)",
    iconName: "icon-people-arrows",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      setPropertyReadOnly("fordrecommendpost", "name");
      setPropertyReadOnly("fordrecommendpost", "_ffs");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "After this experience, how likely are you to recommend Ford to a friend or colleague?",
        es: "Después de esta experiencia, ¿qué tan probable es que recomiende Ford a un amigo o colega?",
        fr: "Après cette expérience, quelle est la probabilité que vous recommandiez Ford à un ami ou collègue?",
      },
      renderAs: "radiobuttongroup",
      isRequired: true,
      choices: [
        {
          value: 1,
          text: {
            en: "Definitely Will NOT Recommend",
            es: "Definitivamente NO recomendaré",
            fr: "Je ne recommanderai certainement PAS",
          },
        },
        {
          value: 2,
          text: {
            en: "Probably Will NOT Recommend",
            es: "Probablemente NO recomendaré",
            fr: "Je ne recommanderai probablement PAS",
          },
        },
        {
          value: 3,
          text: {
            en: "Maybe Will / Maybe Will Not Recommend",
            es: "Tal vez recomendaré / Tal vez no recomendaré",
            fr: "Peut-être que je recommanderai / Peut-être que je ne recommanderai pas",
          },
        },
        {
          value: 4,
          text: {
            en: "Probably Will Recommend",
            es: "Probablemente recomendaré",
            fr: "Je recommanderai probablement",
          },
        },
        {
          value: 5,
          text: {
            en: "Definitely Will Recommend",
            es: "Definitivamente recomendaré",
            fr: "Je recommanderai certainement",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Ford Purchase Consideration (Post-Event) Question
   * 
   * @description 5-point scale for Ford vehicle purchase consideration after event
   * @_ffs "how_likely_purchasing_post" - Maps to how_likely_purchasing_post field in Ford API
   * @scale 1-5 (Definitely Will NOT to Definitely Will Consider)
   * @when Post-event (after vehicle experience)
   */
  ComponentCollection.Instance.add({
    name: "howlikelypurchasingfordpost",
    title: "How Likely to Purchase Ford (post event)",
    iconName: "icon-chart-bar",
    showInToolbox: true,
    inheritBaseProps: true,
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "After this experience, how likely are you to consider purchasing a Ford vehicle?",
        es: "Después de esta experiencia, ¿qué tan probable es que consideres comprar un vehículo Ford?",
        fr: "Après cette expérience, quelle est la probabilité que vous considériez l'achat d'un véhicule Ford?",
      },
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        {
          value: 1,
          text: {
            en: "Definitely Will NOT Consider",
            es: "Definitivamente NO consideraré",
            fr: "Je ne considérerai certainement PAS",
          },
        },
        {
          value: 2,
          text: {
            en: "Probably Will NOT Consider",
            es: "Probablemente NO consideraré",
            fr: "Je ne considérerai probablement PAS",
          },
        },
        {
          value: 3,
          text: {
            en: "Maybe Will / Maybe Will NOT Consider",
            es: "Tal vez consideraré / Tal vez no consideraré",
            fr: "Peut-être que je considérerai / Peut-être que je ne considérerai pas",
          },
        },
        {
          value: 4,
          text: {
            en: "Probably Will Consider",
            es: "Probablemente consideraré",
            fr: "Je considérerai probablement",
          },
        },
        {
          value: 5,
          text: {
            en: "Definitely Will Consider",
            es: "Definitivamente consideraré",
            fr: "Je considérerai certainement",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Sweepstakes Opt-In Question
   * 
   * @description Radio button group for sweepstakes entry consent
   * @_ffs Not typically mapped - handled as custom logic
   * @legal Includes official rules link and age/residency restrictions
   * @example 2025 Mets Bronco sweepstakes for NY/NJ/CT residents
   * @age_restriction 18+ years old
   */
  ComponentCollection.Instance.add({
    name: "sweepstakesOptIn",
    title: "Sweepstakes Opt-In",
    iconName: "icon-checkbox",
    showInToolbox: true,
    inheritBaseProps: true,
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        child.isRequired = true;
      }
    },
    questionJSON: {
      type: "radiogroup",
      renderAs: "radiobuttongroup",
      name: "sweepstakesOptIn",
      title: "Are you at least 18 years old and would you like to register win a 2025 Mets wrapped Bronco?",
      description: "NO PURCHASE NECESSARY TO ENTER OR WIN. TRAVEL NOT INCLUDED. Open to legal residents of New York: the five (5) Boroughs of New York City and residents of Nassau, Suffolk, Ulster, Orange, Rockland, Sullivan, Dutchess, Putnam, Westchester counties); New Jersey: residents of Sussex, Warren, Morris, Hunterdon, Somerset, Passaic, Bergen, Hudson, Essex, Union, Middlesex, Monmouth, Ocean counties; and Connecticut: residents of New Haven, Fairfield, Litchfield counties who are 18+ at time of entry. Enter by 11:59 PM ET on August 31, 2025. Odds of winning depend on number of eligible entries received. Void where prohibited. Restrictions apply: see Official Rules at [https://blueoval.events/2025_NY_Mets_Official_Rules](https://blueoval.events/2025_NY_Mets_Official_Rules) Sponsor: Tri-State and Upstate FDAF, INC.",
      descriptionLocation: "underInput",
      choices: ["Yes", "No"]
    },
  } as ICustomQuestionTypeConfiguration);

  // Mark Ford questions as initialized
  fordQuestionsInitialized = true;
  console.log('Ford questions initialization completed');
};

export default {
  fordInit,
};