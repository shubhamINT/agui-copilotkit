import React from "react";

interface StandardCardProps {
    children: React.ReactNode;
    themeColor?: string;
    className?: string; // Allow additional custom classes if absolutely necessary (e.g. for background images)
    noPadding?: boolean; // Some widgets might want full bleed (like images)
}

/**
 * StandardCard
 * 
 * A unified wrapper component for all widgets.
 * 
 * Purpose:
 * 1. Enforces w-full h-full to ensure the card fills the parent draggable container.
 * 2. Provides consistent border radius and overflow handling.
 * 3. Centralizes shared styling logic (shadows, backgrounds).
 * 
 * Usage:
 * Wrap your custom widget content in <StandardCard> to ensure it behaves correctly on the canvas.
 */
export const StandardCard = ({
    children,
    themeColor,
    className = "",
    noPadding = false
}: StandardCardProps) => {
    return (
        <div
            className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}
            style={{
                // If a theme color is provided, we can use it for backgrounds or borders.
                // For now, we apply it as a CSS variable for children to use if they want.
                ["--widget-theme-color" as any]: themeColor
            }}
        >
            <div
                className={`w-full h-full flex flex-col ${!noPadding ? "p-6" : ""}`}
            >
                {children}
            </div>
        </div>
    );
};
