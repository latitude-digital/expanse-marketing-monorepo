import {
  surveyLocalization,
  ComponentCollection,
} from "survey-core";
import {
  DefaultFonts,
  QuestionAddedEvent,
  SurveyCreatorModel,
  editorLocalization,
} from "survey-creator-core";
import { registerIcons } from "./fontAwesomeIcons";

import { initThemeFord } from "../themes/surveyJS/ford";
import FordSurveysNew from "../surveyjs_questions/FordSurveysNew";

registerIcons([
  "cars",
  "thumbs-up",
  "people-arrows",
  "genderless",
  "calendar-star",
  "money-check-dollar-pen",
  "chart-bar",
  "calendar-clock",
  "pen-field",
  "car-garage",
  "road-circle-check",
  "comments",
  "signature",
  "calendar-circle-user",
  "cash-register",
  "person-circle-question",
  "user",
  "mobile-retro",
  "mailbox-flag-up",
  "scale-unbalanced",
  "scale-unbalanced-flip",
  "trophy",
  "envelopes-bulk",
]);

export const initSurveyFord = () => {
  // surveyLocalization.supportedLocales = ["en", "es", "fr"];

  // Initialize Ford-specific questions using new universal system
  FordSurveysNew.fordInit();

  DefaultFonts.unshift("FordF1");
};

export const initCreatorFord = (creator: SurveyCreatorModel) => {
  initThemeFord(creator);

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__02fordCategory"] = "Ford Questions";
  enLocale.toolboxCategories["__01fmc"] = "FMC Questions";

  // Manually add Ford questions to the toolbox if they're not already there
  // This is needed because questions registered via the universal system after
  // Creator instantiation don't automatically appear in the toolbox

  // Map question names to proper titles and icons
  const fordQuestionConfig: Record<string, { title: string; icon: string }> = {
    fordvoi: { title: "Ford VOI", icon: "icon-cars" },
    fordvehiclesdriven: { title: "Ford Vehicles Driven", icon: "icon-road-circle-check" },
    fordoptin: { title: "Ford Opt-in", icon: "icon-envelopes-bulk" },
    fordrecommend: { title: "Ford Recommend", icon: "icon-comments" },
    fordrecommendpost: { title: "Ford Recommend Post", icon: "icon-comments" },
    howlikelypurchasingford: { title: "How Likely Purchasing Ford", icon: "icon-scale-unbalanced" },
    howlikelypurchasingfordpost: { title: "How Likely Purchasing Ford Post", icon: "icon-scale-unbalanced-flip" },
    sweepstakesoptin: { title: "Sweepstakes Opt-In", icon: "icon-trophy" },
    fordpassion: { title: "Ford Passion", icon: "icon-comments" },
    fordpassionpost: { title: "Ford Passion Post", icon: "icon-comments" },
    fordcapability: { title: "Ford Capability", icon: "icon-comments" },
    fordcapabilitypost: { title: "Ford Capability Post", icon: "icon-comments" },
  };

  // First, ensure Ford questions exist in the toolbox
  // The questions should already be registered via FordSurveysNew.fordInit()
  const fordQuestions = Object.keys(fordQuestionConfig);

  // Check if Ford questions exist and assign them to the category
  const categoriesToChange: Array<{ name: string; category: string }> = [];
  fordQuestions.forEach(questionName => {
    let item = creator.toolbox.getItemByName(questionName) as any;
    if (!item) {
      // Question not in toolbox, manually add it
      // The questions are registered in ComponentCollection but not automatically added to toolbox
      const config = fordQuestionConfig[questionName];
      creator.toolbox.addItem({
        name: questionName,
        title: config.title,
        iconName: config.icon,
        json: { type: questionName },
        category: "__02fordCategory"
      });
      console.log(`Manually added Ford question '${questionName}' to toolbox`);
    } else {
      // Ensure icon and title are correct for already-registered items
      const config = fordQuestionConfig[questionName];
      if (config) {
        try {
          item.iconName = config.icon;
          item.title = config.title;
        } catch (e) {
          console.warn(`Failed to update toolbox item visuals for ${questionName}`, e);
        }
      }
      categoriesToChange.push({ name: questionName, category: "__02fordCategory" });
    }
  });

  // Also reassign FMC questions to their category
  const fmcQuestions = ["gender", "agebracket", "howlikelyacquire", "inmarkettiming", "vehicledrivenmostmake"];
  fmcQuestions.forEach(questionName => {
    const item = creator.toolbox.getItemByName(questionName);
    if (item) {
      categoriesToChange.push({ name: questionName, category: "__01fmc" });
    }
  });

  if (categoriesToChange.length > 0) {
    creator.toolbox.changeCategories(categoriesToChange);
  } else {
    console.error("No Ford questions found in toolbox to categorize!");
  }

  // Apply Ford-specific category sorting - Personal Info first, then FMC, then Ford
  creator.toolbox.categories = creator.toolbox.categories.sort((a: any, b: any) => {
    const getPriority = (name: string) => {
      if (name === "__00pii") return 1;  // Personal Information Questions
      if (name === "__01fmc") return 2;  // FMC Questions
      if (name === "__02fordCategory") return 3;  // Ford Questions
      if (name === "__02lincolnCategory") return 4;  // Lincoln Questions (if present)
      if (name === "__10wav") return 5;
      if (name.startsWith("__")) return 6;
      return 7;
    };

    return getPriority(a.name) - getPriority(b.name);
  });

  // Open Ford Questions category by default
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__02fordCategory");
  creator.toolbox.updateTitles();
};

export const prepareCreatorOnQuestionAddedFord = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "fordvoi") {
    options.question.name = "fordVOI";
    options.question._ffs = "voi";

    options.question.locTitle.setJson({
      en:
        "I am interested in receiving more information on the following vehicles.",
      es: "Me interesaría recibir más información sobre los siguientes vehículos.",
      fr: "Je suis intéressé à recevoir plus d'informations sur les véhicules suivants.",
    });

    options.question.locDescription.setJson({
      en: "You may select up to three models.",
      es: "Puede seleccionar hasta tres modelos.",
      fr: "Vous pouvez sélectionner jusqu'à trois modèles.",
    });
  }

  if (options.question.getType() === "fordoptin") {
    console.log("fordoptin question added");
    options.question.name = "fordEmailOptIn";
    options.question._ffs = "email_opt_in";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en:
        "Please email me communications including product information, offers, and incentives from Ford Motor Company and the local dealer.",
      es: "Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Ford Motor Company y sus concesionarios.",
      fr: "Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Ford Motor Company et de son concessionnaire.",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en:
        "Ford Motor Company respects your privacy and treats your personal information with care. [Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)",
      es: "Ford Motor Company respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Ford Motor Company.](https://es.ford.com/help/privacy/)",
      fr: "Ford Motor Company respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Ford Motor Company.](https://ford.com/help/privacy/)",
    });
  }

  if (options.question.getType() === "fordrecommend") {
    console.log("fordrecommend question added");
    options.question.name = "howLikelyRecommend";
    options.question._ffs = "how_likely_recommend";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "How likely are you to recommend Ford to a friend, relative or colleague?",
      es: "¿Qué tan probable es que recomiende Ford a un amigo, familiar o colega?",
      fr: "Quelle est la probabilité que vous recommandiez Ford à un ami, un parent ou un collègue?",
    });
  }

  if (options.question.getType() === "fordrecommendpost") {
    console.log("fordrecommendpost question added");
    options.question.name = "howLikelyRecommend (post event)";
    options.question._ffs = "how_likely_recommend_post";
    options.question.isRequired = true;
    options.question.buttonSize = "large";

    options.question.locTitle.setJson({
      en: "Based on your experience today, how likely are you to recommend Ford to a friend, relative or colleague?",
      es: "Basándose en su experiencia de hoy, ¿qué tan probable es que recomiende Ford a un amigo, familiar o colega?",
      fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous recommandiez Ford à un ami, un parent ou un collègue?",
    });
  }


  if (options.question.getType() === "howlikelypurchasingford") {
    console.log("how_likely_purchasing question added");
    options.question.name = "howLikelyPurchasing";
    options.question._ffs = "how_likely_purchasing_ford";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "For your next vehicle purchase, how likely would you be to consider purchasing a Ford vehicle?",
      es: "¿Cuál es la probabilidad de que se plantee adquirir un Ford la próxima vez que compre un vehículo?",
      fr: "Pour votre prochain achat de véhicule, quelle est la probabilité que vous envisagiez d'acheter un véhicule Ford?"
    });
  }

  if (options.question.getType() === "howlikelypurchasingfordpost") {
    console.log("howlikelypurchasingfordpost question added");
    options.question.name = "howLikelyPurchasing (post event)";
    options.question._ffs = "how_likely_purchasing_ford_post";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "Based on your experience today, how likely would you be to consider purchasing a Ford vehicle?",
      es: "Basándose en su experiencia de hoy, ¿qué tan probable es que considere comprar un vehículo Ford?",
      fr: "Sur la base de votre expérience d'aujourd'hui, quelle est la probabilité que vous envisagiez d'acheter un véhicule Ford?",
    });
  }

  if (options.question.getType() === "sweepstakesoptin") {
    console.log("sweepstakesoptin question added");
    options.question._ffs = "custom.sweepstakes_opt_in";
  }

  if (options.question.getType() === "fordpassion") {
    console.log("fordpassion question added");
    options.question._ffs = "custom.passion";
  }

  if (options.question.getType() === "fordcapability") {
    console.log("fordcapability question added");
    options.question._ffs = "custom.capability";
  }

  if (options.question.getType() === "fordpassionpost") {
    console.log("fordpassionpost question added");
    options.question._ffs = "custom.passion_post";
  }

  if (options.question.getType() === "fordcapabilitypost") {
    console.log("fordcapabilitypost question added");
    options.question._ffs = "custom.capability_post";
  }

};
