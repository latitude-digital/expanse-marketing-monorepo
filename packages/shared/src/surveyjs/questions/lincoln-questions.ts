/**
 * Lincoln-specific question definitions
 */

import { QuestionConfig } from '../types';

export const lincolnQuestions: QuestionConfig[] = [
  {
    name: 'lincolnvoi',
    baseType: 'checkbox',
    title: 'Lincoln VOI',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'voi',  // Maps to voi field in Lincoln API
        visible: true,
      },
      {
        name: 'onlyInclude',
        displayName: 'Only Include these vehicle_ids',
        type: 'text',
        category: 'general',
      },
    ],
    defaultValues: {
      renderAs: 'voi',
      maxSelectedChoices: 3,
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/lincoln.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'lincolnvehiclesdriven',
    baseType: 'checkbox',
    title: 'Lincoln Vehicles Driven',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'vehiclesDriven',  // Maps to vehiclesDriven field
        visible: true,
      },
      {
        name: 'onlyInclude',
        displayName: 'Only Include these vehicle_ids',
        type: 'text',
        category: 'general',
      },
    ],
    defaultValues: {
      renderAs: 'vehiclesdriven',
      choicesByUrl: {
        url: 'https://cdn.latitudewebservices.com/vehicles/lincoln.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'lincolnoptin',
    baseType: 'radiogroup',
    title: 'Lincoln Opt-In',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'emailOptIn',  // Maps to emailOptIn field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'Please email me communications including product information, offers, and incentives from Lincoln and the local retailer.',
        es: 'Quiero recibir comunicaciones, incluidas información sobre productos y servicios, encuestas, y ofertas especiales de Lincoln y sus minoristas.',
        fr: 'Je souhaite recevoir des communications, y des informations sur les produits et services, des enquêtes, et des offres spéciales de Lincoln et de son détaillant.',
      },
      description: {
        en: "Lincoln respects your privacy and treats your personal information with care. [Click here to read Lincoln's privacy policy.](https://lincoln.com/help/privacy/)",
        es: 'Lincoln respeta su confidencialidad y trata su información personal con respeto. [Haga clic aquí para consultar la política de confidencialidad de Lincoln.](https://es.lincoln.com/help/privacy/)',
        fr: 'Lincoln respecte votre vie privée et traite vos informations personnelles avec soin. [Cliquez ici pour lire la politique de confidentialité de Lincoln.](https://lincoln.com/help/privacy/)',
      },
      descriptionLocation: 'underInput',
      choices: [
        { value: 1, text: 'Yes' },
        { value: 0, text: 'No' },
      ],
    },
  },
  {
    name: 'lincolnoverallopinion',
    baseType: 'rating',
    title: 'Lincoln Overall Opinion',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'impression',  // Maps to impression field
        visible: true,
      },
    ],
    defaultValues: {
      title: {
        en: 'What is your overall opinion or impression of Lincoln?',
        es: '¿Cuál es su opinión general o impresión de Lincoln?',
        fr: 'Quelle est votre opinion générale ou impression de Lincoln?',
      },
      description: {
        en: 'Please click on the response that indicates your preference.',
        es: 'Por favor, haga clic en la respuesta que indica su preferencia.',
        fr: 'Veuillez cliquer sur la réponse qui indique votre préférence.',
      },
      rateCount: 10,
      rateMax: 10,
      minRateDescription: 'Poor',
      maxRateDescription: 'Excellent',
    },
  },
  {
    name: 'lincolnoverallopinionpost',
    baseType: 'rating',
    title: 'Lincoln Overall Opinion Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'impression_post',  // Maps to impression_post field
        visible: true,
      },
    ],
    defaultValues: {
      title: {
        en: "Now that you've experienced a vehicle what is your overall opinion or impression of Lincoln?",
        es: 'Ahora que ha experimentado un vehículo, ¿cuál es su opinión general o impresión de Lincoln?',
        fr: "Maintenant que vous avez expérimenté un véhicule, quelle est votre opinion générale ou impression de Lincoln?",
      },
      description: {
        en: 'Please click on the response that indicates your preference.',
        es: 'Por favor, haga clic en la respuesta que indica su preferencia.',
        fr: 'Veuillez cliquer sur la réponse qui indique votre préférence.',
      },
      rateCount: 10,
      rateMax: 10,
      minRateDescription: 'Poor',
      maxRateDescription: 'Excellent',
    },
  },
  {
    name: 'lincolnrecommend',
    baseType: 'radiogroup',
    title: 'Lincoln Recommend',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend',  // Maps to how_likely_recommend field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'How likely are you to recommend Lincoln to a friend or colleague?',
        es: '¿Qué tan probable es que recomiende Lincoln a un amigo o colega?',
        fr: 'Quelle est la probabilité que vous recommandiez Lincoln à un ami ou collègue?',
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Recommend', es: 'Definitivamente NO recomendaré', fr: 'Je ne recommanderai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Recommend', es: 'Probablemente NO recomendaré', fr: 'Je ne recommanderai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will Not Recommend', es: 'Tal vez recomendaré / Tal vez no recomendaré', fr: 'Peut-être que je recommanderai / Peut-être que je ne recommanderai pas' } },
        { value: 4, text: { en: 'Probably Will Recommend', es: 'Probablemente recomendaré', fr: 'Je recommanderai probablement' } },
        { value: 5, text: { en: 'Definitely Will Recommend', es: 'Definitivamente recomendaré', fr: 'Je recommanderai certainement' } },
      ],
    },
  },
  {
    name: 'lincolnrecommendpost',
    baseType: 'radiogroup',
    title: 'Lincoln Recommend Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend_post',  // Maps to how_likely_recommend_post field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'After this experience, how likely are you to recommend Lincoln to a friend or colleague?',
        es: 'Después de esta experiencia, ¿qué tan probable es que recomiende Lincoln a un amigo o colega?',
        fr: "Après cette expérience, quelle est la probabilité que vous recommandiez Lincoln à un ami ou collègue?",
      },
      choices: [
        { value: 1, text: { en: 'Definitely Will NOT Recommend', es: 'Definitivamente NO recomendaré', fr: 'Je ne recommanderai certainement PAS' } },
        { value: 2, text: { en: 'Probably Will NOT Recommend', es: 'Probablemente NO recomendaré', fr: 'Je ne recommanderai probablement PAS' } },
        { value: 3, text: { en: 'Maybe Will / Maybe Will Not Recommend', es: 'Tal vez recomendaré / Tal vez no recomendaré', fr: 'Peut-être que je recommanderai / Peut-être que je ne recommanderai pas' } },
        { value: 4, text: { en: 'Probably Will Recommend', es: 'Probablemente recomendaré', fr: 'Je recommanderai probablement' } },
        { value: 5, text: { en: 'Definitely Will Recommend', es: 'Definitivamente recomendaré', fr: 'Je recommanderai certainement' } },
      ],
    },
  },
  {
    name: 'lincolnpurchaseconsideration',
    baseType: 'radiogroup',
    title: 'Lincoln Purchase Consideration',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_purchasing',  // Maps to how_likely_purchasing field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'For your next vehicle, how likely would you be to consider a Lincoln?',
        es: 'Para su próximo vehículo, ¿qué tan probable es que considere un Lincoln?',
        fr: 'Pour votre prochain véhicule, quelle est la probabilité que vous considériez un Lincoln?',
      },
      description: {
        en: 'Please click on the response that indicates your preference.',
        es: 'Por favor, haga clic en la respuesta que indica su preferencia.',
        fr: 'Veuillez cliquer sur la réponse qui indique votre préférence.',
      },
      descriptionLocation: 'underInput',
      choices: [
        { value: 'E', text: { en: 'Definitely Would NOT Consider', es: 'Definitivamente NO consideraría', fr: 'Je ne considérerais certainement PAS' } },
        { value: 'D', text: { en: 'Probably Would NOT Consider', es: 'Probablemente NO consideraría', fr: 'Je ne considérerais probablement PAS' } },
        { value: 'C', text: { en: 'Maybe Would / Maybe Would NOT Consider', es: 'Tal vez consideraría / Tal vez no consideraría', fr: 'Peut-être que je considérerais / Peut-être que je ne considérerais pas' } },
        { value: 'B', text: { en: 'Probably Would Consider', es: 'Probablemente consideraría', fr: 'Je considérerais probablement' } },
        { value: 'A', text: { en: 'Definitely Would Consider', es: 'Definitivamente consideraría', fr: 'Je considérerais certainement' } },
      ],
    },
  },
  {
    name: 'lincolnpurchaseconsiderationpost',
    baseType: 'radiogroup',
    title: 'Lincoln Purchase Consideration Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_purchasing_post',  // Maps to how_likely_purchasing_post field
        visible: true,
      },
    ],
    defaultValues: {
      renderAs: 'radiobuttongroup',
      isRequired: true,
      title: {
        en: 'Based on your test-drive experience, how likely would you be to consider purchasing a vehicle from Lincoln?',
        es: 'Basándose en su experiencia de prueba de manejo, ¿qué tan probable es que considere comprar un vehículo de Lincoln?',
        fr: "Sur la base de votre expérience d'essai routier, quelle est la probabilité que vous considériez l'achat d'un véhicule Lincoln?",
      },
      description: {
        en: 'Please click on the response that indicates your preference.',
        es: 'Por favor, haga clic en la respuesta que indica su preferencia.',
        fr: 'Veuillez cliquer sur la réponse qui indique votre préférence.',
      },
      descriptionLocation: 'underInput',
      choices: [
        { value: 'E', text: { en: 'Definitely Would NOT Consider', es: 'Definitivamente NO consideraría', fr: 'Je ne considérerais certainement PAS' } },
        { value: 'D', text: { en: 'Probably Would NOT Consider', es: 'Probablemente NO consideraría', fr: 'Je ne considérerais probablement PAS' } },
        { value: 'C', text: { en: 'Maybe Would / Maybe Would NOT Consider', es: 'Tal vez consideraría / Tal vez no consideraría', fr: 'Peut-être que je considérerais / Peut-être que je ne considérerais pas' } },
        { value: 'B', text: { en: 'Probably Would Consider', es: 'Probablemente consideraría', fr: 'Je considérerais probablement' } },
        { value: 'A', text: { en: 'Definitely Would Consider', es: 'Definitivamente consideraría', fr: 'Je considérerais certainement' } },
      ],
    },
  },
];
