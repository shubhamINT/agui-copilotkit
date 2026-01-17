"use client";

import React, { useState, useRef, useEffect } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCoAgent, useFrontendTool, useCopilotChat } from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { motion, AnimatePresence } from "framer-motion";
import "@copilotkit/react-ui/styles.css";

// Import your custom UI components
import { UniversalCard, UniversalCardData } from "@/components/universal-card";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { WIDGET_REGISTRY } from "@/config/widget-registry";
import { ProgressBar } from "@/components/progress-bar";

// ==========================================
// 1. CUSTOM AGENT MESSAGE (Reasoning UI)
// ==========================================

function AgentMessage({ bubbleContent }: { bubbleContent: string }) {
    const [showReasoning, setShowReasoning] = useState(false);

    let displayContent = bubbleContent;
    let reasoning = "";

    try {
        const parsed = JSON.parse(bubbleContent);
        if (parsed.chat_message) {
            displayContent = parsed.chat_message;
            reasoning = parsed.thought;
        }
    } catch (e) {
        // Not JSON, treat as raw text
    }

    // Prevents rendering empty bubbles for tool-only messages
    if (!displayContent && !reasoning) return null;

    return (
        <div className="flex flex-col gap-2 w-full mb-4">
            {/* Main Response Bubble */}
            {displayContent && (
                <div className="p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white text-gray-800 border border-gray-100 rounded-tl-none">
                    {displayContent}
                </div>
            )}

            {/* Reasoning Toggle */}
            {reasoning && (
                <div className="self-start">
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wide transition-all"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-300 ${showReasoning ? "rotate-180" : ""}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                        {showReasoning ? "Hide Reasoning" : "View Reasoning"}
                    </button>

                    <AnimatePresence>
                        {showReasoning && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-blue-100 text-sm text-slate-600 leading-relaxed font-mono">
                                    <div className="flex items-center gap-2 mb-2 text-blue-500 font-bold uppercase text-[10px] tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Thought Process
                                    </div>
                                    {reasoning}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

const CustomAssistantMessage = ({ message }: any) => {
    const content = message?.content || message?.text || "";
    return <AgentMessage bubbleContent={content} />;
};

// ==========================================
// 2. TYPES
// ==========================================

interface Widget {
    id: string;
    type: "dynamic_card";
    title: string;
    data: any;
    zIndex: number;
    position: { x: number; y: number };
    initialSize?: { width: number; height: number | "auto" };
}

// ==========================================
// 3. MAIN CONTENT AREA (The Right Side)
// ==========================================

function MainAppContent({
    themeColor,
    widgets,
    closeWidget,
    bringToFront,
    handleSearch,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSearching,
    hasChatStarted
}: any) {
    const constraintsRef = useRef<HTMLDivElement>(null);

    // Show results if we are explicitly searching OR if there are cards to show
    const showResults = isSearching || widgets.length > 0;

    return (
        <div
            className="relative flex-1 h-full overflow-hidden transition-colors duration-1000"
            style={{
                background: `linear-gradient(135deg, ${themeColor}15 0%, #ffffff 40%, ${themeColor}10 100%)`
            }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

            {/* Search Interface - Only visible BEFORE chat starts */}
            {!hasChatStarted && (
                <div className={`absolute inset-0 z-20 flex flex-col items-center transition-all duration-700 ease-in-out ${showResults ? "justify-start pt-12 pb-4" : "justify-center"}`}>
                    <div className={`flex flex-col items-center gap-8 w-full ${showResults ? "max-w-4xl" : "max-w-2xl"} px-6 transition-all duration-700`}>
                        {/* Branding */}
                        <motion.div
                            layoutId="logo"
                            className={`font-extrabold tracking-tighter transition-all duration-700 ${showResults ? "text-3xl" : "text-5xl mb-4"}`}
                        >
                            <span
                                className="bg-clip-text text-transparent drop-shadow-sm transition-all duration-1000"
                                style={{
                                    backgroundImage: `linear-gradient(to right, ${themeColor}, ${themeColor}dd, ${themeColor}aa)`
                                }}
                            >
                                INT
                            </span>
                            <span className="text-slate-800 drop-shadow-sm"> Intelligence</span>
                        </motion.div>

                        {!showResults && (
                            <p className="text-slate-500 mb-4">Search everything with AI.</p>
                        )}

                        <motion.form
                            layoutId="search-bar"
                            onSubmit={handleSearch}
                            className={`relative w-full transition-all duration-500 ${showResults ? "max-w-3xl" : "max-w-xl scale-100"}`}
                        >
                            <div className={`
                                relative group rounded-full overflow-hidden transition-all duration-500
                                ${showResults ? "shadow-lg bg-white/40" : "shadow-2xl bg-white/20"}
                                backdrop-blur-xl border border-white/50 ring-1 ring-black/5
                                ${isLoading ? "ring-2 ring-blue-500/30" : ""}
                            `}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ask anything..."
                                    disabled={isLoading}
                                    className="relative w-full bg-white/60 text-slate-800 border-0 rounded-full pl-8 pr-16 py-5 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all text-lg placeholder:text-slate-400 font-medium disabled:bg-white/90 disabled:text-slate-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`absolute right-2.5 top-2.5 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md ${isLoading ? "opacity-80 scale-95 cursor-wait" : ""}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </button>
                                <ProgressBar isLoading={isLoading} themeColor={themeColor} />
                            </div>
                        </motion.form>
                    </div>
                </div>
            )}

            {/* Results/Widgets Area - Full height when chat started, with top padding before */}
            <div ref={constraintsRef} className={`absolute inset-0 ${hasChatStarted ? "p-8" : "pt-32 p-8"} transition-all duration-500 ${showResults ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="w-full h-full flex items-start justify-center overflow-y-auto">
                    {widgets.map((widget: Widget) => {
                        const designColor = (widget.data as UniversalCardData).design?.themeColor;
                        return (
                            <WidgetWrapper
                                key={widget.id}
                                id={widget.id}
                                title={widget.title}
                                zIndex={widget.zIndex}
                                initialPosition={widget.position}
                                initialSize={widget.initialSize}
                                onClose={closeWidget}
                                onFocus={bringToFront}
                                dragConstraintsRef={constraintsRef}
                                themeColor={designColor || themeColor}
                                backgroundColor={(widget.data as UniversalCardData).design?.backgroundColor}
                                resizable={WIDGET_REGISTRY[widget.type as keyof typeof WIDGET_REGISTRY]?.resizable}
                            >
                                <UniversalCard data={widget.data} />
                            </WidgetWrapper>
                        );
                    })}
                </div>
            </div>

            {/* Footer / Status */}
            <div className="absolute bottom-8 right-8 flex gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Online</span>
                <span>v1.50.2</span>
            </div>
        </div>
    );
}

// ==========================================
// 4. MAIN LAYOUT WRAPPER
// ==========================================

export default function App() {
    // --- STATE MANAGEMENT ---
    const [themeColor, setThemeColor] = useState("#2563EB");
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [highestZ, setHighestZ] = useState(10);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasChatStarted, setHasChatStarted] = useState(false);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [recentCards, setRecentCards] = useState<string[]>([]);  // Track recently added cards
    const [isUiLoading, setIsUiLoading] = useState(false);
    const [pendingWidgetCount, setPendingWidgetCount] = useState(0);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const lastSyncedDimensionsRef = useRef({ width: 0, height: 0 });

    const bringToFront = (id: string) => {
        setHighestZ(prev => prev + 1);
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, zIndex: highestZ + 1 } : w));
    };

    const closeWidget = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    const addWidget = (type: Widget["type"], title: string, data: any, id?: string, shouldClear: boolean = false, initialSize?: { width: number; height: number | "auto" }) => {
        const newId = id || Math.random().toString(36).substring(7);
        let position = { x: 0, y: 0 };

        // Clear all cards if requested
        if (shouldClear) {
            const newWidget: Widget = {
                id: newId,
                type,
                title,
                data,
                zIndex: highestZ + 1,
                position,
                initialSize
            };
            setHighestZ(prev => prev + 1);
            setWidgets([newWidget]);
            setRecentCards([newId]);
            return;
        }

        // Calculate grid position based on recent cards
        const cardWidth = initialSize?.width || 320;
        const cardHeight = initialSize?.height === "auto" ? 400 : (initialSize?.height || 400);
        const padding = 20;
        const availableWidth = canvasDimensions.width || 1200;

        // Calculate how many cards fit per row
        const cardsPerRow = Math.floor(availableWidth / (cardWidth + padding)) || 1;

        // Check if updating existing card
        const existingIndex = widgets.findIndex(w => (id && w.id === id) || (type === "dynamic_card" && w.title === title));

        if (existingIndex !== -1) {
            setWidgets(prev => {
                const newWidgets = [...prev];
                const existing = newWidgets[existingIndex];
                newWidgets[existingIndex] = {
                    ...existing,
                    title,
                    data: { ...existing.data, ...data },
                    zIndex: highestZ + 1,
                    initialSize: initialSize || existing.initialSize
                };
                return newWidgets;
            });
            setHighestZ(prev => prev + 1);
            return;
        }

        // Calculate position for NEW card
        const currentCardCount = widgets.length;
        const col = currentCardCount % cardsPerRow;
        const row = Math.floor(currentCardCount / cardsPerRow);

        position = {
            x: col * (cardWidth + padding) + padding,
            y: row * (cardHeight + padding) + padding
        };

        const newWidget: Widget = {
            id: newId,
            type,
            title,
            data,
            zIndex: highestZ + 1,
            position,
            initialSize: initialSize || { width: cardWidth, height: "auto" }
        };

        // Add new card
        setHighestZ(prev => prev + 1);
        setWidgets(prev => [...prev, newWidget]);

        // Track recent cards for potential batch layout
        setRecentCards(prev => {
            const updated = [...prev, newId];
            // Keep only last 20 cards in tracking
            return updated.slice(-20);
        });
    };

    // --- CANVAS DIMENSION TRACKING ---
    useEffect(() => {
        if (!canvasRef.current) return;

        const updateDimensions = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const newWidth = Math.round(rect.width);
                const newHeight = Math.round(rect.height);

                setCanvasDimensions(prev => {
                    if (prev.width === newWidth && prev.height === newHeight) {
                        return prev;
                    }
                    return { width: newWidth, height: newHeight };
                });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(canvasRef.current);

        return () => resizeObserver.disconnect();
    }, [hasChatStarted]);

    // --- AGENT CONNECTION ---
    const { state, setState } = useCoAgent({
        name: "sample_agent",
        initialState: {
            canvas_width: canvasDimensions.width,
            canvas_height: canvasDimensions.height
        }
    });

    // Update agent state when canvas dimensions change
    // IMPORTANT: Don't include setState in dependencies to avoid infinite loop
    useEffect(() => {
        // Only update if dimensions actually changed from last sync
        if (
            canvasDimensions.width !== lastSyncedDimensionsRef.current.width ||
            canvasDimensions.height !== lastSyncedDimensionsRef.current.height
        ) {
            lastSyncedDimensionsRef.current = canvasDimensions;
            setState({
                canvas_width: canvasDimensions.width,
                canvas_height: canvasDimensions.height
            });
        }
    }, [canvasDimensions]); // Only depend on canvasDimensions, NOT setState

    const { appendMessage, isLoading } = useCopilotChat({
        id: "main-chat"
    });

    // --- FRONTEND TOOLS ---
    useFrontendTool({
        name: "setThemeColor",
        parameters: [{ name: "themeColor", type: "string", required: true }],
        handler({ themeColor }) {
            setThemeColor(themeColor);
        },
    });

    useFrontendTool({
        name: "render_ui",
        description: "Displays a flexible card with mixed content. ",
        parameters: [
            { name: "id", type: "string", required: false },
            { name: "title", type: "string", required: true },
            { name: "content", type: "object[]", required: true },
            { name: "design", type: "object", required: false },
            { name: "layout", type: "string", required: false },
            { name: "clearHistory", type: "boolean", required: false },
            { name: "dimensions", type: "object", required: false }
        ],
        handler({ id, title, content, design, clearHistory, dimensions }) {
            addWidget("dynamic_card", title, { title, content, design }, id, clearHistory, dimensions as any);

            // Increment pending count to track widget rendering
            setPendingWidgetCount(prev => prev + 1);

            // Clear any existing timeout
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }

            // Set a timeout to dismiss loading after animations complete
            // This gives time for framer-motion animations to finish
            loadingTimeoutRef.current = setTimeout(() => {
                setIsUiLoading(false);
                setPendingWidgetCount(0);
            }, 1500); // 1.5 seconds should cover staggered animations
        }
    });

    useFrontendTool({
        name: "delete_card",
        description: "Deletes a card/widget.",
        parameters: [
            { name: "id", type: "string", required: false },
            { name: "title", type: "string", required: false }
        ],
        handler({ id, title }) {
            if (id) {
                closeWidget(id);
            } else if (title) {
                const target = widgets.find(w => w.title.toLowerCase().includes(title.toLowerCase()));
                if (target) {
                    closeWidget(target.id);
                }
            }
        }
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleAguiAction = (e: any) => {
            const { action, payload, cardTitle } = e.detail;
            appendMessage(
                new TextMessage({
                    role: Role.User,
                    content: `[Form Submitted: ${cardTitle}]\nAction: ${action}\nData: ${JSON.stringify(payload, null, 2)}`
                })
            );
        };
        window.addEventListener("agui:action", handleAguiAction);
        return () => window.removeEventListener("agui:action", handleAguiAction);
    }, [appendMessage]);

    // --- SEARCH HANDLER ---
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setHasChatStarted(true);
        setIsSearching(true);
        setIsUiLoading(true);
        await appendMessage(
            new TextMessage({
                role: Role.User,
                content: searchQuery
            })
        );
        // After appendMessage, if no UI rendering was triggered within 3 seconds, clear loading
        // This acts as a fallback in case the agent doesn't call render_ui
        setTimeout(() => {
            if (pendingWidgetCount === 0) {
                setIsUiLoading(false);
            }
        }, 3000);
    };

    return (
        <div className="flex flex-row h-screen w-full overflow-hidden bg-white" style={{ "--copilot-kit-primary-color": themeColor } as any}>

            {/* LEFT SIDE: AI Chat (Conditional Sidebar with Animation) */}
            <AnimatePresence>
                {hasChatStarted && (
                    <motion.div
                        initial={{ x: -450, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -450, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-[450px] flex flex-col border-r border-slate-100 bg-gradient-to-b from-blue-50/30 via-white to-indigo-50/20"
                    >
                        <div className="bg-white/50 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col">
                                <h2 className="font-extrabold text-xl tracking-tighter">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
                                        INT
                                    </span>
                                    <span className="text-slate-800"> Intelligence</span>
                                </h2>
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Powered by AI</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <CopilotChat
                                instructions="You are a helpful assistant for INT Intelligence."
                                labels={{
                                    title: "INT Copilot",
                                    initial: "Hi! I can help you search through our SDK and docs.",
                                    placeholder: "Type a message...",
                                }}
                                AssistantMessage={CustomAssistantMessage}
                                className="h-full"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RIGHT SIDE: Main Content & Dynamic UI */}
            <div ref={canvasRef} className="flex-1 h-full">
                <MainAppContent
                    themeColor={themeColor}
                    widgets={widgets}
                    closeWidget={closeWidget}
                    bringToFront={bringToFront}
                    handleSearch={handleSearch}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isLoading={isLoading || isUiLoading}
                    isSearching={isSearching}
                    hasChatStarted={hasChatStarted}
                />
            </div>
        </div>
    );
}