/**
 * FMC (Ford Motor Company) shared question definitions
 * Used by both Ford and Lincoln brands
 */

import { QuestionConfig } from '../types';

export const fmcQuestions: QuestionConfig[] = [
  // Demographics (FMC)
  {
    name: 'agebracket', baseType: 'radiogroup', title: 'Age Bracket',
    properties: [{ name: '_ffs', type: 'text', default: 'age_bracket', visible: true }],
  },
  {
    name: 'gender', baseType: 'radiogroup', title: 'Gender',
    properties: [{ name: '_ffs', type: 'text', default: 'gender', visible: true }],
  },
  // Market research (FMC)
  {
    name: 'howlikelyacquire', baseType: 'radiogroup', title: 'How Likely Acquire',
    properties: [{ name: '_ffs', type: 'text', default: 'how_likely_acquire', visible: true }],
  },
  {
    name: 'inmarkettiming', baseType: 'radiogroup', title: 'In Market Timing',
    properties: [{ name: '_ffs', type: 'text', default: 'in_market_timing', visible: true }],
  },
  {
    name: 'vehicledrivenmostmake', baseType: 'dropdown', title: 'Vehicle Make Most Driven',
    properties: [{ name: '_ffs', type: 'text', default: 'vehicle_driven_most_make_id', visible: true }],
    defaultValues: {
      choicesByUrl: { url: 'https://cdn.latitudewebservices.com/data/makes.json', valueName: 'make_id', titleName: 'make' },
      placeholder: { en: 'Select / Search...' },
    },
  },
];
