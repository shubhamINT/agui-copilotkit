"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing import List, Literal

from langchain.tools import tool
from langchain.agents import create_agent
from copilotkit import CopilotKitMiddleware, CopilotKitState

@tool
def get_company_info(info_types: List[Literal["services", "location"]]):
    """
    Get information about the company's services or location. Returns structured data for the UI.
    """
    results = []
    
    if "services" in info_types:
        results.append({
            "id": "services",
            "title": "Our Services",
            "description": "We specialize in AI Consulting, Custom Software Development, and Cloud Architecture, helping businesses transform through modern technology."
        })
    
    if "location" in info_types:
        results.append({
            "id": "location",
            "title": "Our Offices",
            "description": "Headquartered in San Francisco, CA, with strategic global hubs in London and Bangalore to serve our international clients."
        })
        
    return results

@tool
def get_weather(location: str):
    """
    Get the weather for a given location.
    """
    return f"The weather for {location} is 70 degrees."

@tool
def send_email(to: str, subject: str, body: str):
    """
    Send an email to a recipient.
    """
    print(f"Sending email to {to} with subject: {subject}")
    print(f"Body: {body}")
    return "Email sent successfully."

class AgentState(CopilotKitState):
    proverbs: List[str]

agent = create_agent(
    model="gpt-4.1-mini",
    tools=[get_company_info, get_weather, send_email],
    middleware=[CopilotKitMiddleware()],
    state_schema=AgentState,
    system_prompt="""You are a helpful research assistant.
When the user asks for information, use the `show_dynamic_card` tool to display it visually.

RULES:
1. You can display ANY information using `show_dynamic_card`.
2. Construct the `content` array with blocks:
   - {"type": "text", "value": "...", "variant": "header" | "body"}
   - {"type": "image", "url": "...", "caption": "..."}
   - {"type": "key_value", "data": {"Key": "Value"}}
3. Be creative with the `design` object to match the content's vibe:
   - {"themeColor": "#hex", "fontFamily": "serif" | "sans" | "mono", "backgroundColor": "#hex"}
   - Use 'serif' for literature/history, 'mono' for code/technical, 'sans' for general.

Example:
If asked about Apple, call `show_dynamic_card` with:
title="Apple Inc."
design={"themeColor": "#000000", "fontFamily": "sans"}
content=[
  {"type": "image", "url": "...", "caption": "Apple HQ"},
  {"type": "text", "value": "Apple is a technology company...", "variant": "body"},
  {"type": "key_value", "data": {"CEO": "Tim Cook", "Founded": "1976"}}
]
"""
)

graph = agent
