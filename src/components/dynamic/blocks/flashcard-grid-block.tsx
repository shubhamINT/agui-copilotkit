"use client";

import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { DynamicBlockProps } from "../registry";

interface FlashcardItem {
    title: string;
    description: string;
    url?: string;
    label?: string;
    icon?: string;
}

export const FlashcardGridBlock: React.FC<DynamicBlockProps> = ({ data, design }) => {
    const items: FlashcardItem[] = data?.items || [];
    const themeColor = design?.themeColor || "#2563EB";
    const backgroundColor = design?.backgroundColor || "#ffffff";
    const fontColor = design?.fontColor || "#1e293b";

    // Font size mapping
    const fontSizeMap = {
        small: { title: "text-sm", description: "text-xs" },
        medium: { title: "text-base", description: "text-sm" },
        large: { title: "text-lg", description: "text-base" }
    };
    const fontSize = fontSizeMap[design?.fontSize as keyof typeof fontSizeMap] || fontSizeMap.medium;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,  // Increased stagger for better streaming effect
            },
        },
    };

    const itemAnim: any = {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        },
    };

    // Calculate optimal grid columns based on item count
    const getGridCols = (count: number) => {
        if (count <= 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-1 md:grid-cols-2";
        if (count <= 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
        if (count <= 8) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
        if (count <= 12) return "grid-cols-1 md:grid-cols-3 lg:grid-cols-4";
        return "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
    };

    const gridClass = getGridCols(items.length);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid ${gridClass} gap-4 mt-2`}
        >
            {items.map((item, idx) => (
                <motion.div
                    key={idx}
                    variants={itemAnim}
                    whileHover={{
                        scale: 1.03,
                        boxShadow: `0 10px 25px -5px ${themeColor}20`,
                    }}
                    className="group relative flex flex-col p-5 rounded-2xl border shadow-sm transition-all hover:border-opacity-50"
                    style={{
                        backgroundColor: backgroundColor,
                        borderColor: themeColor + "30",
                        color: fontColor
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        {item.icon && (
                            <span className="text-xl">{item.icon}</span>
                        )}
                        <h4
                            className={`font-bold group-hover:opacity-80 transition-colors ${fontSize.title}`}
                            style={{ color: themeColor }}
                        >
                            {item.title}
                        </h4>
                    </div>

                    {/* Use ReactMarkdown for description */}
                    <div
                        className={`leading-relaxed flex-1 prose prose-sm max-w-none ${fontSize.description}`}
                        style={{ color: fontColor }}
                    >
                        <ReactMarkdown
                            components={{
                                a: ({ node, ...props }) => (
                                    <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold hover:underline"
                                        style={{ color: themeColor }}
                                    />
                                ),
                                strong: ({ node, ...props }) => (
                                    <strong {...props} style={{ color: themeColor }} />
                                ),
                                p: ({ node, ...props }) => (
                                    <p {...props} className="mb-2 last:mb-0" />
                                )
                            }}
                        >
                            {item.description}
                        </ReactMarkdown>
                    </div>

                    {item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:translate-x-1"
                            style={{ color: themeColor }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {item.label || "Learn More"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                    )}
                </motion.div>
            ))}
        </motion.div>
    );
};
