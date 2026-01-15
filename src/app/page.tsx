"use client";

import { ProverbsCard } from "@/components/proverbs";
import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { CompanyCard } from "@/components/company-info";
import { useCoAgent, useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui"; // 1. Import CopilotPopup
import { useState, useRef } from "react";

export default function CopilotKitPage() {
  // --- STATE MANAGEMENT ---
  const [themeColor, setThemeColor] = useState("#2563EB");
  const [weatherData, setWeatherData] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<"proverbs" | "weather" | "moon" | "company" | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [companyInfo, setCompanyInfo] = useState<any[]>([]);
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
      setWeatherData(location);
      setActiveComponent("weather");
    },
  });

  // Company Info Tool
  useFrontendTool({
    name: "show_company_info",
    parameters: [{ name: "info", type: "object", required: true }],
    handler({ info }) {
      setCompanyInfo(info as any[]);
      setActiveComponent("company");
    },
  });

  // Proverbs View Switcher
  useFrontendTool({
    name: "show_proverbs_view",
    handler() {
      setActiveComponent("proverbs");
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
          setActiveComponent("moon");
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
        backgroundColor: activeComponent ? "#f3f4f6" : "#ffffff"
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
        {!activeComponent && (
          <div className="text-center max-w-lg">
            <h1 className="text-5xl font-extrabold mb-6 text-gray-800 tracking-tight">
              CoAgent Canvas
            </h1>
            <p className="text-xl text-gray-500">
              Open the chat bubble ↘️ to control this screen.
            </p>
            <div className="mt-8 flex justify-center gap-4 text-sm text-gray-400">
              <span>Try: "Check weather in Tokyo"</span>
              <span>•</span>
              <span>"Show me proverbs"</span>
            </div>
          </div>
        )}

        {/* Dynamic Components */}
        {activeComponent === "proverbs" && (
          <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-300">
            <ProverbsCard state={state} setState={setState} />
          </div>
        )}

        {activeComponent === "weather" && weatherData && (
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeatherCard location={weatherData} themeColor={themeColor} />
          </div>
        )}

        {activeComponent === "moon" && (
          <div className="w-full max-w-xl animate-in fade-in duration-300">
            <MoonCard themeColor={themeColor} status={moonStatus} respond={moonRespond} />
          </div>
        )}

        {activeComponent === "company" && companyInfo.map((item) => (
          <CompanyCard
            key={item.id}
            item={item}
            themeColor={themeColor}
            constraintsRef={constraintsRef as any}
          />
        ))}

      </div>

      {/* 
        ----------------------------------------------------
        COPILOT POPUP (Bottom Right Widget)
        ----------------------------------------------------
      */}
      <CopilotPopup
        instructions="You are a helpful assistant. Call 'show_proverbs_view' for proverbs, 'get_weather' for weather, and 'show_company_info' to show company data cards."
        labels={{
          title: "Assistant",
          initial: "Hi! I can update the screen for you. Try asking for the weather.",
        }}
        defaultOpen={false} // Start closed (bubble mode)
        clickOutsideToClose={false} // Keep it open while interacting
      />

    </main>
  );
}