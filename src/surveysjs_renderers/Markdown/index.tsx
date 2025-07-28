import React from "react";
import { CssClassBuilder, defaultV2Css, ElementFactory, LocalizableString, QuestionFactory, QuestionNonValue, Serializer } from "survey-core";
import { editorLocalization } from "survey-creator-core";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import Showdown from "showdown";

import { registerIconManually } from "../../helpers/fontAwesomeIcons";

import "./markdown.css";

export const CUSTOM_QUESTION_TYPE = "markdown";

// builder text
const locale = editorLocalization.getLocale("");
locale.qt[CUSTOM_QUESTION_TYPE] = "Markdown";
locale.pe.markdown = "Markdown Text";
locale.pe.scrollView = "Use Scroll View";
locale.pehelp.question.markdown = "Text that uses the [markdown syntax](https://www.markdownguide.org/cheat-sheet/).";
locale.pehelp.question.scrollView = "Puts the markdown text in a height-limited scroll view.";

// builder icon
registerIconManually("icon-markdown", "markdown", "brands");

(defaultV2Css as any)[CUSTOM_QUESTION_TYPE] = defaultV2Css["html"];

const converter = new Showdown.Converter({
    openLinksInNewWindow: true,
});

/**
  * A class that describes the HTML question type. Unlike other question types, HTML cannot have a title or value.
 *
 * [View Demo](https://surveyjs.io/form-library/examples/questiontype-html/ (linkStyle))
 */
export class QuestionMarkdownModel extends QuestionNonValue {
    public ignoreHtmlProgressing: boolean = false;

    constructor(name: string) {
        super(name);
        var locMarkdown = this.createLocalizableString("markdown", this);
        locMarkdown.onGetTextCallback = (str: string): string => {
            return !!this.survey && !this.ignoreHtmlProgressing
                ? converter.makeHtml(str)
                : str;
        };
    }
    public getType(): string {
        return CUSTOM_QUESTION_TYPE;
    }
    public get isCompositeQuestion(): boolean {
        return true;
    }
    public getProcessedText(text: string): string {
        if (this.ignoreHtmlProgressing) return text;
        return super.getProcessedText(text);
    }
    /**
     * HTML markup to display.
     *
     * > IMPORTANT: If you get the markup from a third party, ensure that it does not contain malicious code.
     */
    public get markdown(): string {
        return this.getLocalizableStringText("markdown", "");
    }
    public set markdown(val: string) {
        this.setLocalizableStringText("markdown", val);
    }

    public get scrollView(): boolean {
        return this.getPropertyValue("scrollView");
    }
    public set scrollView(val: boolean) {
        this.setPropertyValue("scrollView", val);
    }

    get locMarkdown(): LocalizableString {
        return this.getLocalizableString("markdown");
    }
    public get processedMarkdown() {
        return this.processHtml(this.markdown);
    }
    private processHtml(markdown: string): string {
        return this.survey ? this.survey.processHtml(markdown, "html-question") : this.markdown;
    }
    public get isNewA11yStructure(): boolean {
        return true;
    }
    public get renderCssRoot(): string {
        return new CssClassBuilder().append(this.cssClasses.root).append(this.cssClasses.nested, this.getIsNested()).toString();
    }
}
// Register `QuestionMarkdownModel` as a constructor for the "markdown" question type
ElementFactory.Instance.registerElement(CUSTOM_QUESTION_TYPE, (name: any) => {
    return new QuestionMarkdownModel(name);
});

Serializer.addClass(
    CUSTOM_QUESTION_TYPE,
    [
        { name: "markdown:text", serializationProperty: "locMarkdown", category: "general" },
        { name: "scrollView:boolean", category: "general" },
        { name: "hideNumber", visible: false },
        { name: "state", visible: false },
        { name: "titleLocation", visible: false },
        { name: "descriptionLocation", visible: false },
        { name: "errorLocation", visible: false },
        { name: "indent", visible: false },
        { name: "width", visible: false },
    ],
    function () {
        return new QuestionMarkdownModel("");
    },
    "question"
);

export class SurveyQuestionMarkdown extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }
    protected get question(): QuestionMarkdownModel {
        return this.questionBase as QuestionMarkdownModel;
    }
    componentDidMount() {
        this.reactOnStrChanged();
    }
    componentWillUnmount() {
        this.question.locMarkdown.onChanged = function () { };
    }
    componentDidUpdate(prevProps: any, prevState: any) {
        this.reactOnStrChanged();
    }
    private reactOnStrChanged() {
        this.question.locMarkdown.onChanged = () => {
            this.setState({ changed: !!this.state && this.state.changed ? this.state.changed + 1 : 1 });
        };
    }
    protected canRender(): boolean {
        return super.canRender() && !!this.question.markdown;
    }
    protected renderElement(): JSX.Element {
        var htmlValue = { __html: this.question.locMarkdown.renderedHtml };
        
        return (
            <div
                className={`${this.question.renderCssRoot}${this.question.scrollView ? " waiver-scroll-view" : ""}`}
                dangerouslySetInnerHTML={htmlValue}
            />
        );
    }
}

ReactQuestionFactory.Instance.registerQuestion(
    CUSTOM_QUESTION_TYPE,
    (props) => {
        return React.createElement(SurveyQuestionMarkdown, props);
    }
);