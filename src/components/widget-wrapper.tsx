"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";

interface WidgetWrapperProps {
    id: string;
    title: string;
    onClose: (id: string) => void;
    onFocus: (id: string) => void;
    zIndex: number;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number | "auto" };
    themeColor?: string;
    backgroundColor?: string;
    children: React.ReactNode;
    dragConstraintsRef?: React.RefObject<HTMLDivElement | null>;
    resizable?: boolean;
}

export const WidgetWrapper = ({
    id,
    title,
    onClose,
    onFocus,
    zIndex,
    initialPosition = { x: 0, y: 0 },
    initialSize,
    themeColor = "#2563EB",
    backgroundColor,
    children,
    dragConstraintsRef,
    resizable = true,
}: WidgetWrapperProps) => {
    const dragControls = useDragControls();
    // Default to a wider, more premium 400px if no size provided
    const [size, setSize] = useState(initialSize || { width: 400, height: "auto" as number | "auto" });
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync initial height if needed, or just let it be auto. 
    // For resizing, we start with auto, but once resized, it becomes fixed.

    const handleResize = (e: React.PointerEvent) => {
        if (!contentRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = contentRef.current.offsetWidth;
        const startHeight = contentRef.current.offsetHeight;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
            // Only constrain height if it was already set or we want to allow vertical resizing
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));

            setSize({ width: newWidth, height: newHeight });
        };

        const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
        };

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
    };

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false} // Only drag from the header
            dragConstraints={dragConstraintsRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.9, ...initialPosition }}
            animate={{ opacity: 1, scale: 1, x: initialPosition.x, y: initialPosition.y }}
            className="absolute flex flex-col bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 ring-1 ring-black/5"
            style={{
                zIndex,
                width: size.width,
                height: size.height === "auto" ? "auto" : size.height,
                minWidth: "320px",
                maxWidth: "90vw",
                boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.15), 0 0 2px rgba(0,0,0,0.05)",
            }}
            onPointerDown={() => onFocus(id)}
            ref={contentRef}
        >
            {/* Header / Drag Handle */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-between px-5 py-4 bg-white/40 border-b border-white/20 cursor-grab active:cursor-grabbing select-none shrink-0 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: themeColor }}
                    />
                    <span className="text-sm font-semibold text-gray-700 tracking-wide">
                        {title}
                    </span>
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose(id);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            {/* Widget Content */}
            <div
                className="p-0 relative backdrop-blur-sm flex-1 overflow-auto"
                style={{
                    backgroundColor: backgroundColor || "rgba(255, 255, 255, 0.5)"
                }}
            >
                {children}
            </div>

            {/* Resize Handle */}
            {resizable && (
                <div
                    onPointerDown={handleResize}
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 hover:bg-gray-100 rounded-tl-lg transition-colors z-50"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                    >
                        <path d="M21 15v6" />
                        <path d="M15 21h6" />
                        <path d="M21 3L3 21" opacity="0.3" />
                    </svg>
                </div>
            )}
        </motion.div>
    );
};
