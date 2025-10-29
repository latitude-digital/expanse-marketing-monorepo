// @ts-nocheck
import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionHtmlModel } from "survey-core";
import { Typography } from "@ui/ford-ui-components";

const FDSHtmlComponent: React.FC<{ question: QuestionHtmlModel }> = ({ question }) => {
    const htmlContent = question.html || "";

    return (
        <div className="fds-html-wrapper">
            <Typography
                as="div"
                displayStyle="body-2-regular"
                displayColor="text-onlight-moderate-default"
                displayBox="block"
                spanProps={{ className: "text-ford-body2-regular" }}
            >
                <span className="fds-html-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </Typography>
        </div>
    );
};

export class FDSHtmlRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionHtmlModel {
        return this.questionBase as QuestionHtmlModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        if (this.question.isDesignMode) {
            return super.renderElement();
        }

        return <FDSHtmlComponent question={this.question} />;
    }
}

export function registerFDSHtmlRenderer(factory = ReactQuestionFactory.Instance) {
    factory.registerQuestion(
        "html",
        (props) => {
            return React.createElement(FDSHtmlRenderer, props);
        }
    );
}
