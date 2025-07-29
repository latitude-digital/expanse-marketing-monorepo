import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import { ICustomQuestionTypeConfigurationVOI } from "./interfaces";

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
};

export default {
  lincolnInit,
};