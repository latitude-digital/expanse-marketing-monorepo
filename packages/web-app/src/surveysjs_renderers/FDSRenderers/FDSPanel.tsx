// @ts-nocheck
import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { PanelModel } from "survey-core";
import { Typography } from "@ui/ford-ui-components";
import { processMarkdown } from "./FDSShared/utils";

// Functional component to handle the panel rendering
const FDSPanelComponent: React.FC<{ panel: PanelModel }> = ({ panel }) => {
    // Check if title and description should be hidden
    const isTitleHidden = panel.titleLocation === "hidden";
    const showTitle = !isTitleHidden && panel.title;
    const showDescription = !isTitleHidden && panel.description;
    
    return (
        <div className="fds-panel-wrapper">
            {/* Panel Title */}
            {showTitle && (
                <div className="fds-panel-title" style={{ marginBottom: '8px' }}>
                    {(() => {
                        const processedTitle = processMarkdown(panel.title);
                        const hasHtml = processedTitle.includes('<');
                        
                        if (hasHtml) {
                            // For HTML content, use Typography component wrapper to ensure font inheritance
                            return (
                                <Typography variant="body2" weight="regular" color="moderate">
                                    <span dangerouslySetInnerHTML={{ __html: processedTitle }} />
                                </Typography>
                            );
                        } else {
                            // For plain text, use Typography component
                            return (
                                <Typography variant="body2" weight="regular" color="moderate">
                                    {processedTitle}
                                </Typography>
                            );
                        }
                    })()}
                </div>
            )}

            {/* Panel Description */}
            {showDescription && (
                <div className="fds-panel-description" style={{ marginBottom: '12px' }}>
                    {(() => {
                        const processedDescription = processMarkdown(panel.description);
                        const hasHtml = processedDescription.includes('<');
                        
                        if (hasHtml) {
                            // For HTML content, use Typography component wrapper to ensure font inheritance
                            return (
                                <Typography variant="body2" color="subtle">
                                    <span dangerouslySetInnerHTML={{ __html: processedDescription }} />
                                </Typography>
                            );
                        } else {
                            // For plain text, use Typography component
                            return (
                                <Typography variant="body2" color="subtle">
                                    {processedDescription}
                                </Typography>
                            );
                        }
                    })()}
                </div>
            )}

            {/* Panel Content - render child elements */}
            <div className="fds-panel-content">
                {panel.elements.map((element: any, index: number) => {
                    const ElementComponent = ReactQuestionFactory.Instance.createQuestion(
                        element.getType(),
                        {
                            question: element,
                            isDisplayMode: panel.isReadOnly,
                            creator: panel.survey
                        }
                    );
                    return (
                        <div key={element.id || index} className="fds-panel-element">
                            {ElementComponent}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export class FDSPanelRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): PanelModel {
        return this.questionBase as PanelModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        // Check if we're in designer mode - use default SurveyJS rendering for editing capabilities
        if (this.question.isDesignMode) {
            return super.renderElement();
        }
        
        return <FDSPanelComponent panel={this.question} />;
    }
}

// Register the panel renderer with useAsDefault: true to replace default SurveyJS panel
export function registerFDSPanelRenderer(factory = ReactQuestionFactory.Instance) {
    factory.registerQuestion(
        "panel",
        (props) => {
            return React.createElement(FDSPanelRenderer, props);
        },
        "customtype", // Using "customtype" for the third parameter to enable useAsDefault
        true // useAsDefault: true - replaces default SurveyJS panel renderer
    );
}
