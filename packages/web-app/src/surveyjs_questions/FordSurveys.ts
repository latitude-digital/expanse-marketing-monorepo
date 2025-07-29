import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import {
  ICustomQuestionTypeConfigurationVOI,
  ICustomQuestionTypeConfigurationWaiver,
} from "./interfaces";

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
    name: "gender",
    title: "Gender",
    iconName: "icon-genderless",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        { value: "male", text: { en: "Male", es: "Hombre", fr: "Homme" } },
        {
          value: "female",
          text: { en: "Female", es: "Mujer", fr: "Femme" },
        },
        {
          value: "prefer_not_to_say",
          text: {
            en: "Prefer Not To Say",
            es: "Prefiero no responder",
            fr: "Je préfère ne pas le dire",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "agebracket",
    title: "Age Bracket",
    iconName: "icon-calendar-star",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        {
          value: "18 - 24",
          text: { en: "18 to 24", es: "18 a 24", fr: "18 à 24" },
        },
        {
          value: "25 - 34",
          text: { en: "25 to 34", es: "25 a 34", fr: "25 à 34" },
        },
        {
          value: "35 - 44",
          text: { en: "35 to 44", es: "35 a 44", fr: "35 à 44" },
        },
        {
          value: "45 - 54",
          text: { en: "45 to 54", es: "45 a 54", fr: "45 à 54" },
        },
        {
          value: "55 - 64",
          text: { en: "55 to 64", es: "55 a 64", fr: "55 à 64" },
        },
        {
          value: "65+",
          text: { en: "65 or older", es: "65 o más", fr: "65 ou plus" },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "howlikelyacquire",
    title: "How Likely to Acquire",
    iconName: "icon-money-check-dollar-pen",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        {
          value: "purchase",
          text: { en: "Purchase", es: "Compra", fr: "Achat" },
        },
        {
          value: "lease",
          text: { en: "Lease", es: "Arrendamiento", fr: "Location" },
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
    name: "inmarkettiming",
    title: "In Market Timing",
    iconName: "icon-calendar-clock",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "radiogroup",
      renderAs: "radiobuttongroup",
      buttonSize: "large",
      choices: [
        {
          value: "0-30_days",
          text: { en: "0-30 Days", es: "0-30 días", fr: "0-30 jours" },
        },
        {
          value: "1-3_months",
          text: { en: "1-3 Months", es: "1-3 meses", fr: "1-3 mois" },
        },
        {
          value: "4-6_months",
          text: { en: "4-6 Months", es: "4-6 meses", fr: "4-6 mois" },
        },
        {
          value: "7+_months",
          text: { en: "7+ Months", es: "7+ meses", fr: "7+ mois" },
        },
        {
          value: "no_plans",
          text: {
            en: "No Definite Plans",
            es: "Sin planes definidos",
            fr: "Pas de plans définis",
          },
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "adultwaiver",
    title: "Adult Waiver",
    iconName: "icon-pen-field",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("adultwaiver", "name").readOnly = true;
      Serializer.getProperty("adultwaiver", "_ffs").readOnly = true;
      Serializer.addProperty("adultwaiver", {
        name: "waiverMarkdown",
        displayName: "Waiver Markdown",
        type: "text",
        category: "general",
        isSerializable: true,
      });
    },
    elementsJSON: [
      {
        type: "markdown",
        name: "waiverText",
        scrollView: true,
      },
      {
        type: "text",
        name: "signature",
        title: {
          en: "Signature",
          es: "Firma",
          fr: "Signature",
        },
        isRequired: true,
        placeholder: {
          en: "Type to Sign",
          es: "Escribe para firmar",
          fr: "Écrivez pour signer",
        },
      },
      {
        type: "checkbox",
        name: "waiver_agree",
        titleLocation: "hidden",
        isRequired: true,
        choices: [
          {
            value: 1,
            text: {
              en: "By typing your name you indicate that you have read and agree to the waiver provided here.",
              es: "Al escribir tu nombre, indicas que has leído y aceptas el acuerdo proporcionado aquí.",
              fr: "En écrivant votre nom, vous indiquez que vous avez lu et accepté l'accord fourni ici.",
            },
          },
        ],
      },
    ],
    onUpdateQuestionCssClasses(question, element, cssClasses) {
      if (question.name === "signature") {
        cssClasses.root += " signatureInput";
      }
    },
    onLoaded(question: Question) {
      this.updateMarkdown(question);
    },
    onPropertyChanged(question: Question, propertyName: string, newValue: any) {
      if (propertyName === "waiverMarkdown") {
        this.updateMarkdown(question);
      }
    },
    updateMarkdown(question: Question) {
      const markdownBox = question.getQuestionByName("waiverText");
      if (!!markdownBox) {
        markdownBox.markdown = question.waiverMarkdown;
      }
    },
  } as ICustomQuestionTypeConfigurationWaiver);

  ComponentCollection.Instance.add({
    name: "minorwaiver",
    title: "Minor Waiver",
    iconName: "icon-pen-field",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("minorwaiver", "name").readOnly = true;
      Serializer.getProperty("minorwaiver", "_ffs").readOnly = true;
      Serializer.addProperty("minorwaiver", {
        name: "waiverMarkdown",
        displayName: "Waiver Markdown",
        type: "text",
        category: "general",
        isSerializable: true,
      });
    },
    elementsJSON: [
      {
        type: "radiogroup",
        renderAs: "radiobuttongroup",
        name: "minorsYesNo",
        title: {
          en: "I have minors accompanying me",
          es: "Tengo menores acompañándome",
          fr: "J'ai des mineurs avec moi",
        },
        isRequired: true,
        choices: [
          {
            value: "1",
            text: {
              en: "Yes",
              es: "Si",
              fr: "Oui",
            },
          },
          {
            value: "0",
            text: {
              en: "No",
              es: "No",
              fr: "Non",
            },
          },
        ],
      },
      {
        type: "markdown",
        name: "minorWaiverText",
        scrollView: true,
        visibleIf: "{composite.minorsYesNo} = '1'",
      },
      {
        type: "text",
        name: "minorName1",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 1",
          es: "Nombre completo del menor 1",
          fr: "Nom complet du mineur 1",
        },
        isRequired: true,
      },
      {
        type: "text",
        name: "minorName2",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 2",
          es: "Nombre completo del menor 2",
          fr: "Nom complet du mineur 2",
        },
      },
      {
        type: "text",
        name: "minorName3",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 3",
          es: "Nombre completo del menor 3",
          fr: "Nom complet du mineur 3",
        },
      },
      {
        type: "text",
        name: "minorSignature",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Parent/Guardian Signature",
          es: "Firma del padre/tutor",
          fr: "Signature du parent/tuteur",
        },
        isRequired: true,
        placeholder: "Type to Sign",
      },
    ],
    onUpdateQuestionCssClasses(question, element, cssClasses) {
      if (question.name === "minorSignature") {
        cssClasses.root += " signatureInput";
      }
    },
    onLoaded(question: Question) {
      this.updateMarkdown(question);
    },
    onPropertyChanged(question: Question, propertyName: string, newValue: any) {
      if (propertyName === "waiverMarkdown") {
        this.updateMarkdown(question);
      }
    },
    updateMarkdown(question: Question) {
      const markdownBox = question.getQuestionByName("minorWaiverText");
      if (!!markdownBox) {
        markdownBox.markdown = question.waiverMarkdown;
      }
    },
  } as ICustomQuestionTypeConfigurationWaiver);

  ComponentCollection.Instance.add({
    name: "vehicledrivenmostmake",
    title: "Vehicle Make Most Driven",
    iconName: "icon-car-garage",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "dropdown",
      choicesByUrl: {
        url: "https://cdn.latitudewebservices.com/data/makes.json",
        valueName: "make_id",
        titleName: "make"
      },
      placeholder: {
        en: "Select / Search...",
        es: "Seleccionar / Buscar...",
        fr: "Sélectionner / Rechercher...",
      },
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