import { ICustomQuestionTypeConfiguration, IHeader, ITheme } from "survey-core";

// Define a new interface that extends ITheme
export interface IExtendedTheme extends ITheme {
  favicon?: string;
  header?: IHeaderFixed;
}

export interface IHeaderFixed extends IHeader {
  mobileHeight?: number;
}

// interface for VOI custom questions
export interface ICustomQuestionTypeConfigurationVOI
  extends ICustomQuestionTypeConfiguration {
  updateOnlyInclude: (question: any) => void;
}

// interface for Waiver custom questions
export interface ICustomQuestionTypeConfigurationWaiver
  extends ICustomQuestionTypeConfiguration {
  updateMarkdown: (question: any) => void;
}