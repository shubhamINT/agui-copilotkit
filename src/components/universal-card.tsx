"use client";

import React from "react";

// --- Types ---
export type FontType = "sans" | "serif" | "mono";

export interface CardDesign {
    themeColor?: string;
    fontFamily?: FontType;
    backgroundColor?: string;
}

export interface ContentBlock {
    type: "text" | "image" | "key_value" | "link";
    [key: string]: any;
}

export interface UniversalCardData {
    title: string;
    design?: CardDesign;
    content: ContentBlock[];
}

// --- Helper Functions ---
const getFontClass = (font?: FontType) => {
    switch (font) {
        case "serif": return "font-serif";
        case "mono": return "font-mono";
        default: return "font-sans";
    }
};

// --- Sub-Components ---

const TextSection = ({ value, variant, design }: { value: string, variant?: string, design?: CardDesign }) => {
    const isHeader = variant === "header";
    return (
        <div className={`mb-4 last:mb-0 ${isHeader ? "border-b pb-2" : ""}`} style={{ borderColor: design?.themeColor || "#e5e7eb" }}>
            <p className={`${isHeader ? "text-lg font-bold" : "text-sm text-gray-700 leading-relaxed"}`}>
                {value}
            </p>
        </div>
    );
};

const ImageSection = ({ url, caption }: { url: string, caption?: string }) => {
    return (
        <div className="mb-4 last:mb-0">
            <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm relative aspect-video bg-gray-100">
                <img src={url} alt={caption || "Card image"} className="object-cover w-full h-full" />
            </div>
            {caption && <p className="text-xs text-gray-500 mt-1 italic">{caption}</p>}
        </div>
    );
};

const KeyValueSection = ({ data, design }: { data: Record<string, string>, design?: CardDesign }) => {
    return (
        <div className="grid grid-cols-2 gap-3 mb-4 last:mb-0 p-3 bg-white/50 rounded-lg border border-gray-100">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{key}</p>
                    <p className="text-sm font-medium text-gray-800" style={{ color: design?.themeColor }}>{value}</p>
                </div>
            ))}
        </div>
    );
};

const LinkSection = ({ url, label, design }: { url: string, label: string, design?: CardDesign }) => {
    return (
        <div className="mt-4 pt-3 border-t border-gray-100">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-all"
                style={{ color: design?.themeColor || "#2563EB" }}
            >
                {label}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
        </div>
    );
};

// --- Main Component ---

export const UniversalCard = ({ data }: { data: UniversalCardData }) => {
    const { design, content } = data;
    const fontClass = getFontClass(design?.fontFamily);

    return (
        <div
            className={`p-6 h-full w-full overflow-y-auto ${fontClass}`}
            style={{ backgroundColor: design?.backgroundColor || "transparent" }}
        >
            {/* Render Blocks */}
            {content.map((block, idx) => {
                switch (block.type) {
                    case "text":
                        return <TextSection key={idx} value={block.value} variant={block.variant} design={design} />;
                    case "image":
                        return <ImageSection key={idx} url={block.url} caption={block.caption} />;
                    case "key_value":
                        return <KeyValueSection key={idx} data={block.data} design={design} />;
                    case "link":
                        return <LinkSection key={idx} url={block.url} label={block.label} design={design} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
};
