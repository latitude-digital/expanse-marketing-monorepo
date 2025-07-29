import {
  slk,
  surveyLocalization,
  SurveyModel,
} from "survey-core";
import {
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
  SurveyInstanceCreatedEvent,
} from "survey-creator-core";

import { CheckboxVOIQuestion } from "../surveysjs_renderers/CheckboxVOI";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/RadioButtonButton";
import { SurveyBookeoQuestion } from "../surveysjs_renderers/Bookeo";
import { EmailTextInput } from "../surveysjs_renderers/EmailTextInput";
import { SurveyQuestionMarkdown } from "../surveysjs_renderers/Markdown";
import { FDSTextRenderer } from "../surveysjs_renderers/FDSRenderers/FDSText";
import "../surveysjs_renderers/FDSRenderers/CustomSurveyQuestion";

import Showdown from "showdown";
import { registerIcons } from "./fontAwesomeIcons";
import { AllSurveys } from "../surveyjs_questions";

console.log(
  CheckboxVOIQuestion.name,
  RadioGroupRowQuestion.name,
  SurveyBookeoQuestion.name,
  EmailTextInput.name,
  SurveyQuestionMarkdown.name,
  FDSTextRenderer.name,
);

const converter = new Showdown.Converter({
  openLinksInNewWindow: true,
});

registerIcons([
  "person-circle-question",
  "person-circle-question",
  "house-circle-check",
  "at",
  "phone",
]);

export const initSurvey = () => {
  slk(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wNy0xOSwyPTIwMjUtMDctMTksND0yMDI1LTA3LTE5"
  );

  // surveyLocalization.supportedLocales = ["en", "es"];
  
  // Add custom localized string for "(Optional)" text
  // Ensure the locale objects exist before setting properties
  if (!surveyLocalization.locales["en"]) {
    surveyLocalization.locales["en"] = {};
  }
  if (!surveyLocalization.locales["es"]) {
    surveyLocalization.locales["es"] = {};
  }
  if (!surveyLocalization.locales["fr"]) {
    surveyLocalization.locales["fr"] = {};
  }
  
  // Set custom optionalText for our custom renderers
  surveyLocalization.locales["en"]["optionalText"] = " (Optional)";
  surveyLocalization.locales["es"]["optionalText"] = " (Opcional)";
  surveyLocalization.locales["fr"]["optionalText"] = " (Optionnel)";
  

  AllSurveys.globalInit();
};

export const initCreator = (creator: SurveyCreatorModel) => {
  creator.toolbox.showCategoryTitles = true;
  creator.toolbox.forceCompact = false;
  creator.toolbox.canCollapseCategories = true;
  creator.toolbox.allowExpandMultipleCategories = true;
  creator.toolbox.keepAllCategoriesExpanded = false;

  const themeTabPlugin = creator.themeEditor;

  // sort the themes so that the custom themes starting with __ are at the top
  if (themeTabPlugin && themeTabPlugin.availableThemes) {
    themeTabPlugin.availableThemes = themeTabPlugin.availableThemes.sort(
      (a: string, b: string) => {
      if (a.startsWith("__") && !b.startsWith("__")) {
        return -1;
      } else if (!a.startsWith("__") && b.startsWith("__")) {
        return 1;
      } else if (a.startsWith("__") && b.startsWith("__")) {
        return a.localeCompare(b); // Sort alphabetically if both start with __
      } else {
        return a.localeCompare(b); // Sort alphabetically if neither starts with __
      }
    }
  );
  }

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__0pii"] = "Personal Information Questions";

  creator.toolbox.changeCategories([
    { name: "markdown", category: "misc"},
    { name: "optin", category: "choice" },
    { name: "autocompleteaddress", category: "__0pii" },
    { name: "autocompleteaddress2", category: "__0pii" },
    { name: "firstname", category: "__0pii" },
    { name: "lastname", category: "__0pii" },
    { name: "email", category: "__0pii" },
    { name: "phone", category: "__0pii" },
  ]);

  const md = creator.toolbox.getItemByName("markdown");
  md.tooltip = "Markdown";
  md.setPropertyValue("iconName", "icon-markdown");

  // sort the toolbox categories so that the custom categories starting with __ are at the top
  creator.toolbox.categories = creator.toolbox.categories.sort(
    (a: any, b: any) => {
      if (a.name.startsWith("__") && !b.name.startsWith("__")) {
        return -1;
      } else if (!a.name.startsWith("__") && b.name.startsWith("__")) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    }
  );

  // open just the first category
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__0pii");
  creator.toolbox.updateTitles();
};

export const prepareForSurvey = (thisSurvey: SurveyModel) => {
  // add custom css classes
  thisSurvey.onUpdateQuestionCssClasses.add((survey, options) => {
    if (options.question.name === "signature") {
      options.cssClasses.root += " signatureInput";
    }
  });

  // add markdown support
  thisSurvey.onTextMarkdown.add(function (survey, options) {
    //convert the mardown text to html
    var str = converter.makeHtml(options.text);
    //remove root paragraphs <p></p>
    str = str.substring(3);
    str = str.substring(0, str.length - 4);
    //set html
    options.html = str;
  });
};

export const prepareSurveyOnQuestionAdded = (
  creator: SurveyCreatorModel,
  options: SurveyInstanceCreatedEvent
) => {
  options.survey.onAfterRenderQuestionInput.add((survey, questionOptions) => {
    if (questionOptions.question.name === "address1") {
      const autocomplete = new google.maps.places.Autocomplete(
        questionOptions.htmlElement as HTMLInputElement,
        {
          types: ["address"],
          componentRestrictions: {
            country: ["us"],
          },
          fields: ["address_components", "formatted_address"],
          ...questionOptions.question.addressAutocompleteConfig,
        }
      );

      autocomplete.addListener("place_changed", async function () {
        const place = await autocomplete.getPlace();

        const ParsedData: Record<string, any> = {
          formatted_address: place.formatted_address,
        };

        const postalData = place.address_components?.find((item) =>
          item.types.includes("postal_code")
        );
        const countryData = place.address_components?.find((item) =>
          item.types.includes("country")
        );
        const addressData = place.address_components?.find((item) =>
          item.types.includes("administrative_area_level_1")
        );
        const cityData = place.address_components?.find((item) =>
          item.types.includes("locality")
        );
        const routeData = place.address_components?.find((item) =>
          item.types.includes("route")
        );
        const streetNumberData = place.address_components?.find((item) =>
          item.types.includes("street_number")
        );

        ParsedData.address1 = [
          streetNumberData?.long_name,
          routeData?.long_name,
        ]
          .join(" ")
          .trim();
        ParsedData.city = cityData == null ? "" : cityData.long_name;
        ParsedData.state = addressData == null ? "" : addressData.short_name;
        ParsedData.zip_code = postalData == null ? "" : postalData.long_name;
        ParsedData.country = countryData == null ? "" : countryData.short_name;

        const isComposite = survey.getQuestionByName("address_group");
        if (isComposite) {
          survey.setValue("address_group", ParsedData);
        } else {
          [
            "address1",
            "city",
            "state",
            "zip_code",
            "country",
          ].forEach((key) => {
            try {
              survey.setValue(key, ParsedData[key]);
            } catch (e) {
              console.log("error", e);
            }
          });
        }
      });
    }
  });
};

export const prepareCreatorOnQuestionAdded = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "optin") {
    options.question.titleLocation = "hidden";
    options.question.descriptionLocation = "underInput";
    options.question.label = "I agree";
  }

  if (options.question.getType() === "autocompleteaddress") {
    console.log("autocompleteaddress question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddress2") {
    console.log("autocompleteaddress2 question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "firstname") {
    console.log("firstname question added");
    options.question.name = "first_name";
    options.question._ffs = "first_name";

    options.question.locTitle.setJson({
      en: "First Name",
      es: "Nombre",
      fr: "Prénom",
    });
  }

  if (options.question.getType() === "lastname") {
    console.log("lastname question added");
    options.question.name = "last_name";
    options.question._ffs = "last_name";

    options.question.locTitle.setJson({
      en: "Last Name",
      es: "Apellidos",
      fr: "Nom de famille",
    });
  }

  if (options.question.getType() === "email") {
    console.log("email question added");
    options.question.name = "email";
    options.question._ffs = "email";

    options.question.locTitle.setJson({
      en: "Email Address",
      es: "Correo electrónico",
      fr: "Email",
    });
  }

  if (options.question.getType() === "phone") {
    console.log("phone question added");
    options.question.name = "phone";
    options.question._ffs = "phone";

    options.question.locTitle.setJson({
      en: "Mobile Number",
      es: "Teléfono",
      fr: "Téléphone",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en: "Standard message and data rates may apply.",
      es: "Pueden aplicar las tarifas normales para mensajes de texto y datos.",
      fr: "Les tarifs standard pour les messages et les données peuvent s'appliquer.",
    });
  }

};
