import React, { useState, useEffect } from "react";
import { ReactElementFactory } from "survey-react-ui";
import "./FilePreview.css";

interface FilePreviewComponentProps {
    question: any;
}

interface FilePreview {
    dataUrl?: string;
    isImage: boolean;
}

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ question }) => {
    const [filePreviews, setFilePreviews] = useState<Map<string, FilePreview>>(new Map());

    useEffect(() => {
        if (!question || !question.value || question.value.length === 0) {
            setFilePreviews(new Map());
            return;
        }

        // Generate previews for new files
        question.value.forEach((fileItem: any) => {
            // First check if preview exists in question's cache
            if (question.previewCache && question.previewCache.has(fileItem.name)) {
                const cachedPreview = question.previewCache.get(fileItem.name);
                setFilePreviews(prev => {
                    const newMap = new Map(prev);
                    newMap.set(fileItem.name, cachedPreview);
                    return newMap;
                });
            } else if (!filePreviews.has(fileItem.name) && fileItem.file) {
                const file = fileItem.file;
                const isImage = file.type.startsWith('image/');
                
                if (isImage) {
                    // Create preview for image files
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = { 
                            dataUrl: e.target?.result as string, 
                            isImage: true 
                        };
                        // Store in question's cache if available
                        if (question.previewCache) {
                            question.previewCache.set(fileItem.name, preview);
                        }
                        
                        setFilePreviews(prev => {
                            const newMap = new Map(prev);
                            newMap.set(fileItem.name, preview);
                            return newMap;
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    // For non-image files, just mark as processed
                    const preview = { isImage: false };
                    if (question.previewCache) {
                        question.previewCache.set(fileItem.name, preview);
                    }
                    
                    setFilePreviews(prev => {
                        const newMap = new Map(prev);
                        newMap.set(fileItem.name, preview);
                        return newMap;
                    });
                }
            }
        });
    }, [question?.value]);

    if (!question || !question.value || question.value.length === 0) {
        return null;
    }

    const isReadOnly = question.isReadOnly || (question.survey && question.survey.readOnly);

    const removeFile = (fileItem: any) => {
        if (!isReadOnly) {
            question.removeFile(fileItem.name);
            // Clean up preview from question's cache
            if (question.previewCache) {
                question.previewCache.delete(fileItem.name);
            }
            setFilePreviews(prev => {
                const newMap = new Map(prev);
                newMap.delete(fileItem.name);
                return newMap;
            });
        }
    };

    return (
        <div className="file-preview-container">
            {question.value.map((fileItem: any) => {
                const preview = filePreviews.get(fileItem.name);
                const showImagePreview = preview?.isImage && preview.dataUrl;
                
                return (
                    <div className="uploaded-file-item" key={fileItem.name}>
                        {showImagePreview && (
                            <div className="image-preview">
                                <img 
                                    src={preview.dataUrl} 
                                    alt={fileItem.name}
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '150px',
                                        objectFit: 'contain',
                                        borderRadius: '4px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                />
                            </div>
                        )}
                        <div>
                            <div className="file-success-indicator">
                                {/* Green check icon */}
                                <div className="check-icon">
                                    <svg viewBox="0 0 24 24" className="check-svg">
                                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                </div>
                                <span className="file-accepted-text">
                                    Photo accepted
                                </span>
                            </div>
                            {!isReadOnly && (
                                <button
                                    className="remove-file-btn"
                                    onClick={() => removeFile(fileItem)}
                                    title="Remove file"
                                    type="button"
                                >
                                    <svg viewBox="0 0 24 24" className="remove-icon">
                                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

ReactElementFactory.Instance.registerElement("sv-file-preview", (props) => {
    return React.createElement(FilePreviewComponent, props);
});