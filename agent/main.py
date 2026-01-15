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
When the user asks about the company services or location:
1. Call 'get_company_info' to get the data.
2. ALWAYS call 'show_company_info' with that data to display it as cards on the frontend.
"""
)

graph = agent
