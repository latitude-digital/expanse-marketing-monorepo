import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import { ICustomQuestionTypeConfigurationVOI } from "./interfaces";
import { handleChoicesByUrl } from "./choicesByUrlHelper";

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

  // Register lincolnoptin if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoptin")) {
    ComponentCollection.Instance.add({
      name: "lincolnoptin",
      title: "Lincoln Opt-In",
      iconName: "icon-thumbs-up",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.getProperty("lincolnoptin", "name").readOnly = true;
        Serializer.getProperty("lincolnoptin", "_ffs").readOnly = true;
      },
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
        renderAs: "radiobuttongroup",
        buttonSize: "medium",
        name: "email_opt_in",
        isRequired: true,
        choices: [
          {
            value: 1,
            text: {
              en: "Yes",
              es: "Sí",
              fr: "Oui",
            },
          },
          {
            value: 0,
            text: {
              en: "No",
              es: "No",
              fr: "Non",
            },
          },
        ],
      },
      onLoaded(question: Question) {
      },
    } as ICustomQuestionTypeConfiguration);
  }

  // Register lincolnoverallopinion if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoverallopinion")) {
    ComponentCollection.Instance.add({
      name: "lincolnoverallopinion",
      title: "Lincoln Overall Opinion",
      iconName: "icon-rating",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.getProperty("lincolnoverallopinion", "name").readOnly = true;
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
        // Sync validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child && question.validators?.length > 0) {
          child.validators = [...(child.validators || []), ...question.validators];
          child.isRequired = true;
        }
      },
    } as ICustomQuestionTypeConfiguration);
  }

  // Register lincolnoverallopinionpost if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnoverallopinionpost")) {
    ComponentCollection.Instance.add({
      name: "lincolnoverallopinionpost",
      title: "Lincoln Overall Opinion Post",
      iconName: "icon-rating",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.getProperty("lincolnoverallopinion", "name").readOnly = true;
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
        // Sync validators from parent to child for custom questions
        const child = question.contentQuestion;
        if (child && question.validators?.length > 0) {
          child.validators = [...(child.validators || []), ...question.validators];
          child.isRequired = true;
        }
      },
    } as ICustomQuestionTypeConfiguration);
  }

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
    console.log('lincolnvehiclesdriven question type registered successfully!');
  } else {
    console.log('lincolnvehiclesdriven already exists, skipping registration');
  }

  // Register lincolnrecommend if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnrecommend")) {
    ComponentCollection.Instance.add({
      name: "lincolnrecommend",
      title: "How Likely Recommend Lincoln",
      iconName: "icon-people-arrows",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.getProperty("lincolnrecommend", "name").readOnly = true;
        Serializer.getProperty("lincolnrecommend", "_ffs").readOnly = true;
      },
      onLoaded(question: Question) {
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

  // Register lincolnrecommendpost if it doesn't exist
  if (!ComponentCollection.Instance.getCustomQuestionByName("lincolnrecommendpost")) {
    ComponentCollection.Instance.add({
      name: "lincolnrecommendpost",
      title: "How Likely Recommend Lincoln (post event)",
      iconName: "icon-people-arrows",
      showInToolbox: true,
      inheritBaseProps: true,
      onInit: () => {
        Serializer.getProperty("lincolnrecommendpost", "name").readOnly = true;
        Serializer.getProperty("lincolnrecommendpost", "_ffs").readOnly = true;
      },
      onLoaded(question: Question) {
        // Fix isRequired inheritance from JSON - this is called AFTER question is created from JSON
        const jsonDef = question.toJSON();
        if (jsonDef.isRequired && !question.isRequired) {
          question.isRequired = jsonDef.isRequired;
          console.log(`[LincolnSurveys DEBUG] Fixed isRequired inheritance for lincolnrecommendpost ${question.name}: ${question.isRequired}`);
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
