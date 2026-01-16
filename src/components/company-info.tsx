"use client";

import React from "react";
import { motion } from "framer-motion";

interface CompanyInfo {
    id: string;
    title: string;
    description: string;
}

import { StandardCard } from "./standard-card";

export const CompanyCard = ({ item, themeColor = "#2563EB" }: { item: CompanyInfo, themeColor?: string }) => {
    return (
        <StandardCard themeColor={themeColor} className="bg-white group" noPadding={false}>
            {/* Decorative Background Blob */}
            <div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150"
                style={{ backgroundColor: themeColor }}
            />

            <div className="relative z-10">
                {/* Decorative Line (Top) */}
                <div
                    className="w-12 h-1 mb-6 rounded-full"
                    style={{ backgroundColor: themeColor }}
                />

                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                    {item.title}
                </h3>

                <p className="text-gray-600 leading-relaxed text-sm">
                    {item.description}
                </p>
            </div>

            {/* Simple hover effect on bottom */}
            <div
                className="absolute bottom-0 left-0 w-full h-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                style={{ backgroundColor: themeColor }}
            />
        </StandardCard>
    );
};
