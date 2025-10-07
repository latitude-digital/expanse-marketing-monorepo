/**
 * Lincoln-specific SurveyJS custom question type definitions
 * 
 * ⚠️ IMPORTANT FOR DEVELOPERS:
 * This file defines the question types and basic structure, but many properties
 * like _ffs values, titles, and validation are set in:
 * /src/helpers/surveyTemplatesLincoln.ts
 * 
 * If you're looking for where _ffs mappings, question titles, or other
 * question properties are configured, check surveyTemplatesLincoln.ts!
 */

import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import { ICustomQuestionTypeConfigurationVOI } from "./interfaces";
import { handleChoicesByUrl } from "./choicesByUrlHelper";

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

const lincolnInit = () => {
  // Check if lincolnvehiclesdriven already exists, if so skip only that registration
  const vehiclesDrivenExists = ComponentCollection.Instance.getCustomQuestionByName("lincolnvehiclesdriven");
  console.log('LincolnSurveys lincolnvehiclesdriven exists:', !!vehiclesDrivenExists);
  
  // Always ensure _ffs property is registered
  if (!Serializer.findProperty("question", "_ffs")) {
    Serializer.addProperty("question", {
      name: "_ffs",
      displayName: "FFS question",
      type: "text",
      category: "data",
      isSerializable: true,
    });
  }

  /**
   * Lincoln Vehicle of Interest (VOI) Question
   * 
   * @description Multi-select checkbox for Lincoln vehicles the customer is interested in
   * @_ffs "voi" - Maps to `voi` array in Lincoln v13 upload payload (no separate endpoint)
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and other properties are configured
   * @max_selections 3 vehicles
   */
  // Register lincolnvoi if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnvoi")) {
    ComponentCollection.Instance.add({
      name: "lincolnvoi",
      title: "Lincoln VOI",
      iconName: "icon-cars",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.addProperty("lincolnvoi", {
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
        description: {
          en: "Select up to 3 Lincoln vehicles you're interested in learning more about.",
          es: "Seleccione hasta 3 vehículos Lincoln sobre los que le gustaría obtener más información.",
          fr: "Sélectionnez jusqu'à 3 véhicules Lincoln qui vous intéressent pour en savoir plus.",
        },
        renderAs: "voi",
        maxSelectedChoices: 3,
        choicesByUrl: {
          url: "https://cdn.latitudewebservices.com/vehicles/lincoln.json",
          valueName: "id",
          titleName: "name",
          image: "image",
        },
      },
      onLoaded(question: Question) {
        this.updateOnlyInclude(question);
        // Use shared utility to handle choicesByUrl for custom question types
        handleChoicesByUrl(question, "LincolnSurveys");
        
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
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
   * Lincoln Email Opt-In Question
   * 
   * @description Radio button group for Lincoln email marketing consent
   * @_ffs "emailOptIn" - Maps to email_opt_in field in Lincoln API (1=Yes, 0=No)
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and privacy policy links are configured
   * @required true
   * @privacy_policy Includes links to Lincoln privacy policy
   */
  // Register lincolnoptin if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoptin")) {
    console.log('Registering Lincoln optin question type...');
    ComponentCollection.Instance.add({
      name: "lincolnoptin",
      title: "Lincoln Opt-In",
      iconName: "icon-thumbs-up",
      showInToolbox: true,
      inheritBaseProps: true,
      questionJSON: {
        type: "radiogroup",
        title: {
          en: "Please email me communications including product information, offers, and incentives from Lincoln and the local retailer.",
          es: "Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Lincoln y sus minoristas.",
          fr: "Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Lincoln et de son détaillant.",
        },
        description: {
          en: "Lincoln respects your privacy and treats your personal information with care. [Click here to read Lincoln's privacy policy.](https://lincoln.com/help/privacy/)",
          es: "Lincoln respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Lincoln.](https://es.lincoln.com/help/privacy/)",
          fr: "Lincoln respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Lincoln.](https://lincoln.com/help/privacy/)",
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
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
    } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Lincoln Overall Opinion (Pre-Event) Question
   * 
   * @description 10-point rating scale for pre-event Lincoln brand impression
   * @_ffs "impression" - Maps to impression field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value is configured (was custom.overallOpinion)
   * @scale 1-10 (Poor to Excellent)
   * @when Pre-event (before vehicle experience)
   */
  // Register lincolnoverallopinion if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoverallopinion")) {
    ComponentCollection.Instance.add({
      name: "lincolnoverallopinion",
      title: "Lincoln Overall Opinion",
      iconName: "icon-rating",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnoverallopinion", "name");
      },
      questionJSON: {
        type: "rating",
        name: "overall_opinion",
        title: "What is your overall opinion or impression of Lincoln?",
        description:
          "Please click on the response that indicates your preference. ",
        rateCount: 10,
        rateMax: 10,
        minRateDescription: "Poor",
        maxRateDescription: "Excellent",
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
    } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Lincoln Overall Opinion (Post-Event) Question
   * 
   * @description 10-point rating scale for post-event Lincoln brand impression
   * @_ffs "impression_post" - Maps to impression_post field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value is configured (was custom.overallOpinionPost)
   * @scale 1-10 (Poor to Excellent)
   * @when Post-event (after vehicle experience)
   */
  // Register lincolnoverallopinionpost if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoverallopinionpost")) {
    ComponentCollection.Instance.add({
      name: "lincolnoverallopinionpost",
      title: "Lincoln Overall Opinion Post",
      iconName: "icon-rating",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnoverallopinionpost", "name");
      },
      questionJSON: {
        type: "rating",
        name: "overall_opinion",
        title: "Now that you've experienced a vehicle what is your overall opinion or impression of Lincoln?",
        description:
          "Please click on the response that indicates your preference. ",
        rateCount: 10,
        rateMax: 10,
        minRateDescription: "Poor",
        maxRateDescription: "Excellent",
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
    } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Lincoln Vehicles Driven Question
   * 
   * @description Multi-select checkbox for Lincoln vehicles actually test driven at event
   * @_ffs "vehiclesDriven" - Mapped by mappers to `vehicles_driven` array in v13 payload (no separate endpoint)
   * @order_driven Tracks sequence in which vehicles were driven (1st, 2nd, 3rd, etc.)
   * @note Different from "vehicle driven most often" survey question - this is for event test drives
   */
  // Register lincolnvehiclesdriven if it doesn't exist - NEW QUESTION TYPE
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnvehiclesdriven")) {
    console.log('Registering new lincolnvehiclesdriven question type...');
    ComponentCollection.Instance.add({
      name: "lincolnvehiclesdriven",
      title: "Lincoln Vehicles Driven",
      iconName: "icon-cars",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.addProperty("lincolnvehiclesdriven", {
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
          en: "Please select the Lincoln vehicles that you experienced today.",
          es: "Por favor seleccione los vehículos Lincoln que experimentó hoy.",
          fr: "Veuillez sélectionner les véhicules Lincoln que vous avez expérimentés aujourd'hui.",
        },
        description: {
          en: "Please select the vehicles in the order you experienced them.",
          es: "Seleccione los vehículos en el orden en que los experimentó.",
          fr: "Veuillez sélectionner les véhicules dans l'ordre où vous les avez expérimentés.",
        },
        renderAs: "vehiclesdriven",
        choicesByUrl: {
          url: "https://cdn.latitudewebservices.com/vehicles/lincoln.json",
          valueName: "id",
          titleName: "name",
          image: "image",
        },
      },
      onLoaded(question: Question) {
        this.updateOnlyInclude(question);
        // Use shared utility to handle choicesByUrl for custom question types
        handleChoicesByUrl(question, "LincolnSurveys");
        
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
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
    console.log('lincolnvehiclesdriven question type registered successfully!');
  } else {
    console.log('lincolnvehiclesdriven already exists, skipping registration');
  }

  /**
   * Lincoln Recommend (Pre-Event) Question
   * 
   * @description 5-point recommendation scale for Lincoln brand
   * @_ffs "how_likely_recommend" - Maps to how_likely_recommend field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and titles are configured
   * @scale 1-5 (Definitely Will NOT to Definitely Will Recommend)
   * @when Pre-event (before vehicle experience)
   */
  // Register lincolnrecommend if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnrecommend")) {
    ComponentCollection.Instance.add({
      name: "lincolnrecommend",
      title: "How Likely Recommend Lincoln",
      iconName: "icon-people-arrows",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnrecommend", "name");
        setPropertyReadOnly("lincolnrecommend", "_ffs");
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
      questionJSON: {
        type: "radiogroup",
        title: {
          en: "How likely are you to recommend Lincoln to a friend or colleague?",
          es: "¿Qué tan probable es que recomiende Lincoln a un amigo o colega?",
          fr: "Quelle est la probabilité que vous recommandiez Lincoln à un ami ou collègue?",
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
  }

  /**
   * Lincoln Purchase Consideration Question
   * 
   * @description 5-point scale for likelihood of considering Lincoln for next vehicle purchase
   * @_ffs "how_likely_purchasing" - Maps to how_likely_purchasing field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and titles are configured
   * @scale 1-5 (Definitely Would NOT Consider to Definitely Would Consider)
   */
  // Register lincolnpurchaseconsideration if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnpurchaseconsideration")) {
    ComponentCollection.Instance.add({
      name: "lincolnpurchaseconsideration",
      title: "Lincoln Purchase Consideration",
      iconName: "icon-car-garage",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnpurchaseconsideration", "name");
        setPropertyReadOnly("lincolnpurchaseconsideration", "_ffs");
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
      questionJSON: {
        type: "radiogroup",
        title: {
          en: "For your next vehicle, how likely would you be to consider a Lincoln?",
          es: "Para su próximo vehículo, ¿qué tan probable es que considere un Lincoln?",
          fr: "Pour votre prochain véhicule, quelle est la probabilité que vous considériez un Lincoln?",
        },
        description: {
          en: "Please click on the response that indicates your preference.",
          es: "Por favor, haga clic en la respuesta que indica su preferencia.",
          fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
        },
        descriptionLocation: "underInput",
        renderAs: "radiobuttongroup",
        buttonSize: "medium",
        name: "purchase_consideration",
        isRequired: true,
        choices: [
          {
            value: "E",
            text: {
              en: "Definitely Would NOT Consider",
              es: "Definitivamente NO consideraría",
              fr: "Je ne considérerais certainement PAS",
            },
          },
          {
            value: "D",
            text: {
              en: "Probably Would NOT Consider",
              es: "Probablemente NO consideraría",
              fr: "Je ne considérerais probablement PAS",
            },
          },
          {
            value: "C",
            text: {
              en: "Maybe Would / Maybe Would NOT Consider",
              es: "Tal vez consideraría / Tal vez no consideraría",
              fr: "Peut-être que je considérerais / Peut-être que je ne considérerais pas",
            },
          },
          {
            value: "B",
            text: {
              en: "Probably Would Consider",
              es: "Probablemente consideraría",
              fr: "Je considérerais probablement",
            },
          },
          {
            value: "A",
            text: {
              en: "Definitely Would Consider",
              es: "Definitivamente consideraría",
              fr: "Je considérerais certainement",
            },
          },
        ],
      },
    } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Lincoln Purchase Consideration Post-Event Question
   * 
   * @description 5-point scale for likelihood of considering purchasing Lincoln after test drive
   * @_ffs "how_likely_purchasing_post" - Maps to how_likely_purchasing_post field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and titles are configured
   * @scale A-E (A=Definitely Would Consider to E=Definitely Would NOT Consider)
   * @when Post-event (after test drive experience)
   */
  // Register lincolnpurchaseconsiderationpost if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnpurchaseconsiderationpost")) {
    ComponentCollection.Instance.add({
      name: "lincolnpurchaseconsiderationpost",
      title: "Lincoln Purchase Consideration Post",
      iconName: "icon-car-garage",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnpurchaseconsiderationpost", "name");
        setPropertyReadOnly("lincolnpurchaseconsiderationpost", "_ffs");
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
      questionJSON: {
        type: "radiogroup",
        title: {
          en: "Based on your test-drive experience, how likely would you be to consider purchasing a vehicle from Lincoln?",
          es: "Basándose en su experiencia de prueba de manejo, ¿qué tan probable es que considere comprar un vehículo de Lincoln?",
          fr: "Sur la base de votre expérience d'essai routier, quelle est la probabilité que vous considériez l'achat d'un véhicule Lincoln?",
        },
        description: {
          en: "Please click on the response that indicates your preference.",
          es: "Por favor, haga clic en la respuesta que indica su preferencia.",
          fr: "Veuillez cliquer sur la réponse qui indique votre préférence.",
        },
        descriptionLocation: "underInput",
        renderAs: "radiobuttongroup",
        buttonSize: "medium",
        name: "purchase_consideration_post",
        isRequired: true,
        choices: [
          {
            value: "E",
            text: {
              en: "Definitely Would NOT Consider",
              es: "Definitivamente NO consideraría",
              fr: "Je ne considérerais certainement PAS",
            },
          },
          {
            value: "D",
            text: {
              en: "Probably Would NOT Consider",
              es: "Probablemente NO consideraría",
              fr: "Je ne considérerais probablement PAS",
            },
          },
          {
            value: "C",
            text: {
              en: "Maybe Would / Maybe Would NOT Consider",
              es: "Tal vez consideraría / Tal vez no consideraría",
              fr: "Peut-être que je considérerais / Peut-être que je ne considérerais pas",
            },
          },
          {
            value: "B",
            text: {
              en: "Probably Would Consider",
              es: "Probablemente consideraría",
              fr: "Je considérerais probablement",
            },
          },
          {
            value: "A",
            text: {
              en: "Definitely Would Consider",
              es: "Definitivamente consideraría",
              fr: "Je considérerais certainement",
            },
          },
        ],
      },
    } as ICustomQuestionTypeConfiguration);
  }

  /**
   * Lincoln Recommend (Post-Event) Question
   * 
   * @description 5-point recommendation scale for Lincoln brand after event
   * @_ffs "how_likely_recommend_post" - Maps to how_likely_recommend_post field in Lincoln API
   * @see /src/helpers/surveyTemplatesLincoln.ts - Where _ffs value and titles are configured
   * @scale 1-5 (Definitely Will NOT to Definitely Will Recommend)
   * @when Post-event (after vehicle experience)
   */
  // Register lincolnrecommendpost if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnrecommendpost")) {
    ComponentCollection.Instance.add({
      name: "lincolnrecommendpost",
      title: "How Likely Recommend Lincoln (post event)",
      iconName: "icon-people-arrows",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        setPropertyReadOnly("lincolnrecommendpost", "name");
        setPropertyReadOnly("lincolnrecommendpost", "_ffs");
      },
      onLoaded(question: Question) {
        // Sync isRequired and validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child) {
          // Always sync isRequired from parent to child
          if (question.isRequired) {
            child.isRequired = true;
          }
          // Also sync validators if present
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
      questionJSON: {
        type: "radiogroup",
        title: {
          en: "After this experience, how likely are you to recommend Lincoln to a friend or colleague?",
          es: "Después de esta experiencia, ¿qué tan probable es que recomiende Lincoln a un amigo o colega?",
          fr: "Après cette expérience, quelle est la probabilité que vous recommandiez Lincoln à un ami ou collègue?",
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
  }
};

export default {
  lincolnInit,
};
