/**
 * Ford-specific question definitions
 */

import { QuestionConfig } from '../types';

export const fordQuestions: QuestionConfig[] = [
  {
    name: 'fordvoi',
    baseType: 'checkbox',
    title: 'Ford VOI',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'voi',  // Maps to voi field in Ford API
        visible: false,
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
        url: 'https://cdn.latitudewebservices.com/vehicles/ford.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'fordvehiclesdriven',
    baseType: 'checkbox',
    title: 'Ford Vehicles Driven',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'vehiclesDriven',  // Maps to vehiclesDriven field
        visible: false,
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
        url: 'https://cdn.latitudewebservices.com/vehicles/ford.json',
        valueName: 'id',
        titleName: 'name',
        image: 'image',
      },
    },
  },
  {
    name: 'fordoptin',
    baseType: 'radiogroup',
    title: 'Ford Opt-In',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'emailOptIn',  // Maps to emailOptIn field
        visible: false,
      },
    ],
  },
  {
    name: 'fordrecommend',
    baseType: 'radiogroup',
    title: 'Ford Recommend',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend',  // Maps to how_likely_recommend field
        visible: false,
      },
    ],
  },
  {
    name: 'fordrecommendpost',
    baseType: 'radiogroup',
    title: 'Ford Recommend Post',
    properties: [
      {
        name: '_ffs',
        type: 'text',
        default: 'how_likely_recommend_post',  // Maps to how_likely_recommend_post field
        visible: false,
      },
    ],
  },
  // Ford purchase and acquisition questions - no _ffs values, won't be sent to API
  {
    name: 'howlikelyacquire',
    baseType: 'radiogroup',
    title: 'How Likely Acquire',
  },
  {
    name: 'howlikelypurchasingford',
    baseType: 'radiogroup',
    title: 'How Likely Purchasing Ford',
  },
  {
    name: 'howlikelypurchasingfordpost',
    baseType: 'radiogroup',
    title: 'How Likely Purchasing Ford Post',
  },
  {
    name: 'inmarkettiming',
    baseType: 'radiogroup',
    title: 'In Market Timing',
  },
  {
    name: 'vehicledrivenmostmake',
    baseType: 'text',
    title: 'Vehicle Driven Most Make',
  },
  // Sweepstakes question - no _ffs value
  {
    name: 'sweepstakesOptIn',
    baseType: 'radiogroup',
    title: 'Sweepstakes Opt-In',
    defaultValues: {
      renderAs: 'radiobuttongroup',
    },
  },
];