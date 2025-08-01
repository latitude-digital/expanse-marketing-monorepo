import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import { ICustomQuestionTypeConfigurationVOI } from "./interfaces";
import { handleChoicesByUrl } from "./choicesByUrlHelper";

const lincolnInit = () => {
  Serializer.addProperty("question", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

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
        en: "Please email me communications, including product and service information, surveys and special offers from Lincoln and its retailers.",
        es: "Por favor, envíenme comunicaciones, incluyendo información sobre productos y servicios, encuestas y ofertas especiales de Lincoln y sus minoristas.",
        fr: "Veuillez m'envoyer des communications, y compris des informations sur les produits et services, des enquêtes et des offres spéciales de Lincoln et de ses détaillants.",
      },
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
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "lincolnoverallopinion",
    title: "Lincoln Overall Opinion",
    iconName: "icon-rating",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("lincolnoverallopinion", "name").readOnly = true;
      Serializer.getProperty("lincolnoverallopinion", "_ffs").readOnly = true;
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
  } as ICustomQuestionTypeConfiguration);


  ComponentCollection.Instance.add({
    name: "lincolnoverallopinionpost",
    title: "Lincoln Overall Opinion Post",
    iconName: "icon-rating",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("lincolnoverallopinion", "name").readOnly = true;
      Serializer.getProperty("lincolnoverallopinion", "_ffs").readOnly = true;
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
  } as ICustomQuestionTypeConfiguration);};

export default {
  lincolnInit,
};
