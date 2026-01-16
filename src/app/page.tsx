"use client";

import { ProverbsCard } from "@/components/proverbs";
import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { CompanyCard } from "@/components/company-info";
import { UniversalCard, UniversalCardData } from "@/components/universal-card";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { WIDGET_REGISTRY } from "@/config/widget-registry";
import { useCoAgent, useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core";
import { CustomChatInterface } from "@/components/custom-chat";
import { useState, useRef } from "react";

interface Widget {
  id: string;
  type: "proverbs" | "weather" | "moon" | "company" | "dynamic_card";
  title: string;
  data: any;
  zIndex: number;
  position: { x: number; y: number };
}

export default function CopilotKitPage() {
  // --- STATE MANAGEMENT ---
  const [themeColor, setThemeColor] = useState("#2563EB");
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Z-Index Management (Highest starts at 10)
  const [highestZ, setHighestZ] = useState(10);

  const bringToFront = (id: string) => {
    setHighestZ(prev => prev + 1);
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, zIndex: highestZ + 1 } : w));
  };

  const closeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const addWidget = (type: Widget["type"], title: string, data: any, id?: string) => {
    // Check if widget already exists by ID (if provided) or Title (as fallback for dynamic cards)
    const existingIndex = widgets.findIndex(w => (id && w.id === id) || (type === "dynamic_card" && w.title === title));

    if (existingIndex !== -1) {
      // UPSERT: Update existing widget
      setWidgets(prev => {
        const newWidgets = [...prev];
        const existing = newWidgets[existingIndex];
        newWidgets[existingIndex] = {
          ...existing,
          title, // Update title if it changed
          data: { ...existing.data, ...data }, // Merge data
          zIndex: highestZ + 1 // Bring to front on update
        };
        return newWidgets;
      });
      setHighestZ(prev => prev + 1);
      return;
    }

    // CREATE NEW
    const newId = id || Math.random().toString(36).substring(7);
    const offset = widgets.length * 30;

    const newWidget: Widget = {
      id: newId,
      type,
      title,
      data,
      zIndex: highestZ + 1,
      position: { x: offset, y: offset }
    };

    setHighestZ(prev => prev + 1);
    setWidgets(prev => [...prev, newWidget]);
  };

  const [moonStatus, setMoonStatus] = useState<any>(null);
  const [moonRespond, setMoonRespond] = useState<any>(null);

  // --- AGENT CONNECTION ---
  const { state, setState } = useCoAgent({
    name: "sample_agent",
    initialState: { proverbs: [] }
  });

  // --- TOOLS (Logic) ---

  // Theme Color Tool
  useFrontendTool({
    name: "setThemeColor",
    parameters: [{ name: "themeColor", type: "string", required: true }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  // Weather Tool
  useFrontendTool({
    name: "get_weather",
    parameters: [{ name: "location", type: "string", required: true }],
    handler({ location }) {
      addWidget("weather", `Weather: ${location}`, location);
    },
  });

  // Company Info Tool
  useFrontendTool({
    name: "show_company_info",
    parameters: [{ name: "info", type: "object", required: true }],
    handler({ info }) {
      (info as any[]).forEach((item) => {
        addWidget("company", item.title, item);
      });
    },
  });

  // Universal / Dynamic Card Tool
  useFrontendTool({
    name: "show_dynamic_card",
    parameters: [
      { name: "id", type: "string", required: false, description: "Stable ID to update existing card" },
      { name: "title", type: "string", required: true },
      { name: "content", type: "object[]", required: true },
      { name: "design", type: "object", required: false }
    ],
    handler({ id, title, content, design }) {
      // Pass ID if available so addWidget can target it
      addWidget("dynamic_card", title, { title, content, design }, id);
    }
  });

  // Delete Card Tool
  useFrontendTool({
    name: "delete_card",
    description: "Deletes a card/widget from the screen. Use this when the user asks to remove, close, or delete a card.",
    parameters: [
      { name: "id", type: "string", required: false, description: "The ID of the card to delete" },
      { name: "title", type: "string", required: false, description: "The title of the card to delete (if ID is unknown)" }
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


  // Proverbs View Switcher
  useFrontendTool({
    name: "show_proverbs_view",
    handler() {
      addWidget("proverbs", "Proverbs", {});
    }
  });

  // Human In the Loop (Moon)
  useHumanInTheLoop(
    {
      name: "go_to_moon",
      render: ({ respond, status }) => {
        if (status !== moonStatus) {
          setMoonStatus(status);
          setMoonRespond(() => respond);

          // Only add if not already there to avoid dupes on re-render
          const exists = widgets.find(w => w.type === "moon");
          if (!exists) {
            addWidget("moon", "Mission Control", {});
          }
        }
        // Return text for inside the chat popup
        return <p className="text-sm">🚀 Mission Control active on main screen.</p>;
      },
    },
    []
  );


  return (
    <main
      className="flex flex-col h-screen relative overflow-hidden transition-colors duration-500"
      style={{
        "--copilot-kit-primary-color": themeColor,
        backgroundColor: widgets.length > 0 ? "#f3f4f6" : "#ffffff"
      } as any}
    >
      {/* 
      ----------------------------------------------------
      MAIN CANVAS AREA (Results Display)
      This occupies the entire screen behind the popup
      ----------------------------------------------------
    */}
      <div ref={constraintsRef} className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center max-w-lg pointer-events-none select-none opacity-50">
            <h1 className="text-5xl font-extrabold mb-6 text-gray-800 tracking-tight">
              CoAgent Canvas
            </h1>
            <p className="text-xl text-gray-500">
              Your premium AI workspace is ready.
            </p>
          </div>
        )}

        {/* Dynamic Widgets */}
        {widgets.map((widget) => {
          const isUniversal = widget.type === "dynamic_card";
          // FIX: Ensure we fallback to null if design is missing, so we don't crash
          // And precedence: widget-specific color -> method-specific color -> default blue
          const designColor = isUniversal ? (widget.data as UniversalCardData).design?.themeColor : null;

          return (
            <WidgetWrapper
              key={widget.id}
              id={widget.id}
              title={widget.title}
              zIndex={widget.zIndex}
              initialPosition={widget.position}
              onClose={closeWidget}
              onFocus={bringToFront}
              dragConstraintsRef={constraintsRef}
              themeColor={designColor || themeColor}
              resizable={isUniversal || WIDGET_REGISTRY[widget.type]?.resizable}

            >
              {widget.type === "proverbs" && <ProverbsCard state={state} setState={setState} />}
              {widget.type === "weather" && <WeatherCard location={widget.data} themeColor={themeColor} />}
              {widget.type === "moon" && <MoonCard themeColor={themeColor} status={moonStatus} respond={moonRespond} />}
              {widget.type === "company" && <CompanyCard item={widget.data} themeColor={themeColor} />}
              {widget.type === "dynamic_card" && <UniversalCard data={widget.data} />}
            </WidgetWrapper>
          );
        })}

      </div>

      {/* 
      ----------------------------------------------------
      COPILOT POPUP (Bottom Right Widget)
      ----------------------------------------------------
    */}
      <CustomChatInterface />

    </main>
  );
}