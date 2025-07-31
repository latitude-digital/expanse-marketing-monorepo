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

const fordInit = () => {
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

  ComponentCollection.Instance.add({
    name: "fordoptin",
    title: "Ford Opt-In",
    iconName: "icon-thumbs-up",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "Please email me communications, including product and service information, surveys and special offers from Ford and its retailers.",
        es: "Por favor, envíenme comunicaciones, incluyendo información sobre productos y servicios, encuestas y ofertas especiales de Ford y sus minoristas.",
        fr: "Veuillez m'envoyer des communications, y compris des informations sur les produits et services, des enquêtes et des offres spéciales de Ford et de ses détaillants.",
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
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "fordrecommend",
    title: "How Likely Recommend Ford",
    iconName: "icon-people-arrows",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("fordrecommend", "name").readOnly = true;
      Serializer.getProperty("fordrecommend", "_ffs").readOnly = true;
    },
    questionJSON: {
      type: "radiogroup",
      title: {
        en: "How likely are you to recommend Ford to a friend or colleague?",
        es: "¿Qué tan probable es que recomiende Ford a un amigo o colega?",
        fr: "Quelle est la probabilité que vous recommandiez Ford à un ami ou collègue?",
      },
      description: "Just putting in a description *here*.",
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




  ComponentCollection.Instance.add({
    name: "howlikelypurchasingford",
    title: "How Likely to Purchase Ford",
    iconName: "icon-chart-bar",
    showInToolbox: true,
    inheritBaseProps: true,
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




  ComponentCollection.Instance.add({
    name: "fordrecommendpost",
    title: "How Likely Recommend Ford (post event)",
    iconName: "icon-people-arrows",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("fordrecommendpost", "name").readOnly = true;
      Serializer.getProperty("fordrecommendpost", "_ffs").readOnly = true;
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

  ComponentCollection.Instance.add({
    name: "howlikelypurchasingfordpost",
    title: "How Likely to Purchase Ford (post event)",
    iconName: "icon-chart-bar",
    showInToolbox: true,
    inheritBaseProps: true,
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
};

export default {
  fordInit,
};