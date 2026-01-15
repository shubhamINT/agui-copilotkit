"use client";

import React from "react";
import { motion } from "framer-motion";

interface CompanyInfo {
    id: string;
    title: string;
    description: string;
}

interface CompanyInfoCardProps {
    item: CompanyInfo;
    themeColor?: string;
    constraintsRef?: React.RefObject<HTMLDivElement | null>;
}

export const CompanyCard = ({ item, themeColor = "#2563EB", constraintsRef }: CompanyInfoCardProps) => {
    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bg-white rounded-3xl p-8 shadow-xl cursor-grab active:cursor-grabbing overflow-hidden border border-gray-100 w-80"
            style={{
                left: "50%",
                top: "50%",
                marginLeft: "-160px",
                marginTop: "-100px",
            }}
        >
            {/* Decorative Background Blob */}
            <div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
                style={{ backgroundColor: themeColor }}
            />

            <div className="relative z-10">
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

            {/* Bottom highlight bar */}
            <div
                className="absolute bottom-0 left-0 w-full h-1"
                style={{ backgroundColor: themeColor }}
            />
        </motion.div>
    );
};
