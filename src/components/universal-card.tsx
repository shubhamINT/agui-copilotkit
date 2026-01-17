"use client";

import React from "react";
import { ComponentRegistry } from "./dynamic/registry";

// --- Types ---
export type FontType = "sans" | "serif" | "mono";

export interface CardDesign {
    themeColor?: string;
    fontFamily?: FontType;
    backgroundColor?: string;
    fontSize?: "small" | "medium" | "large";
    fontColor?: string;
}

export interface ContentBlock {
    type: string;
    [key: string]: any;
}

export interface UniversalCardData {
    title: string;
    design?: CardDesign;
    content: ContentBlock[];
    layout?: "vertical" | "grid";
}

// --- Helper Functions ---
const getFontClass = (font?: FontType) => {
    switch (font) {
        case "serif": return "font-serif";
        case "mono": return "font-mono";
        default: return "font-sans";
    }
};

// --- Main Component ---

export const UniversalCard = ({ data }: { data: UniversalCardData }) => {
    const { design, content } = data;
    const fontClass = getFontClass(design?.fontFamily);

    // This callback handles actions from forms/buttons
    const handleAction = (action: string, payload: any) => {
        console.log(`[UniversalCard] Action Triggered: ${action}`, payload);
        // Dispatch a custom event that page.tsx can listen to if needed, 
        // or integrate directly with CopilotKit if the context is available.
        const event = new CustomEvent("agui:action", {
            detail: { action, payload, cardTitle: data.title }
        });
        window.dispatchEvent(event);
    };

    return (
        <div
            className={`p-6 h-full w-full overflow-y-auto ${fontClass}`}
            style={{ backgroundColor: design?.backgroundColor || "transparent" }}
        >
            {/* Render Blocks via Registry */}
            <div className={`flex ${data.layout === "grid" ? "flex-row flex-wrap" : "flex-col"} gap-2`}>
                {content.map((block, idx) => {
                    const Component = ComponentRegistry[block.type];

                    if (!Component) {
                        return (
                            <div key={idx} className="p-3 mb-2 bg-red-50 border border-red-100 rounded text-xs text-red-500">
                                Unknown block type: "{block.type}"
                            </div>
                        );
                    }

                    return (
                        <Component
                            key={idx}
                            data={block}
                            design={design}
                            onAction={handleAction}
                        />
                    );
                })}
            </div>
        </div>
    );
};
