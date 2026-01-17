"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.

ARCHITECTURE: Capability Matching
- Data Tools: Pure functions that fetch and return structured data
- UI Tool: Universal render_ui that displays any content via the frontend
- Action Tools: State mutations with no UI side effects
"""

from typing import List, Literal, Dict, Any, Optional

from langchain.tools import tool
from langchain.agents import create_agent
from copilotkit import CopilotKitMiddleware, CopilotKitState
from system_prompt import AGENT_PROMPT2
import os
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# Initialize Vector Store
persist_directory = os.path.join(os.path.dirname(__file__), "chroma_db")
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

from pydantic import BaseModel, Field

# ============================================================
# 1. DATA TOOLS (The "Brain" - Fetch Facts)
# ============================================================

class SearchKnowledgeBaseSchema(BaseModel):
    query: str = Field(..., description="The search query string")

@tool(args_schema=SearchKnowledgeBaseSchema)
def search_knowledge_base(query: str):
    """
    The PRIMARY source of truth. Searches the company's internal knowledge base.
    Use this for ALL queries: Services, Locations, Policies, History, Contact info, etc.
    Returns structured JSON with content, image_urls, and source citations.
    """
    results = vectorstore.similarity_search(query, k=3)
    
    structured_results = []
    for doc in results:
        structured_results.append({
            "content": doc.page_content,
            "source": doc.metadata.get("source", "Unknown"),
            "images": doc.metadata.get("image_urls", "").split(",") if doc.metadata.get("image_urls") else []
        })
    
    import json
    return json.dumps(structured_results, indent=2)



# ============================================================
# 2. UNIVERSAL UI TOOL (The "Interface Contract")
# ============================================================

class RenderUISchema(BaseModel):
    title: str = Field(..., description="The card title")
    content: List[Dict[str, Any]] = Field(..., description="A list of content blocks (Markdown, Image, Form, etc.)")
    id: Optional[str] = Field(None, description="Optional stable ID to update existing card")
    design: Optional[dict] = Field(None, description="""
        Optional design config with these properties:
        - themeColor: str (hex color for accents)
        - fontFamily: 'serif' | 'mono' | 'sans'
        - backgroundColor: str (hex color for card background)
        - fontSize: 'small' | 'medium' | 'large' (text size)
        - fontColor: str (hex color for text)
    """)
    layout: Optional[str] = Field(None, description="'vertical' or 'grid'")
    clearHistory: Optional[bool] = Field(None, description="If True, removes all previous cards before rendering this one. Default False.")
    dimensions: Optional[dict] = Field(None, description="Optional size suggestions: {width: number, height: number | 'auto'}")

@tool(args_schema=RenderUISchema)
def render_ui(title: str, content: List[Dict[str, Any]], id: str = None, design: dict = None, layout: str = "vertical", clearHistory: bool = False, dimensions: dict = None):
    """
    The PRIMARY tool for generating UI. This is the bridge to the frontend.
    Tell the user what to show on the screen.
    """
    # This tool doesn't need to DO anything in Python except return success.
    # The frontend intercepts the arguments and handles rendering.
    return f"UI card '{title}' rendered."

# For backwards compatibility, keep show_dynamic_card as an alias
@tool(args_schema=RenderUISchema)
def show_dynamic_card(title: str, content: List[Dict[str, Any]], id: str = None, design: dict = None, layout: str = "vertical", clearHistory: bool = False, dimensions: dict = None):
    """Alias for render_ui"""
    return render_ui(title, content, id, design, layout, clearHistory, dimensions)

# ============================================================
# 3. ACTION TOOLS (State Mutations, No UI)
# ============================================================

class SetThemeColorSchema(BaseModel):
    themeColor: str = Field(..., description="Hex color code (e.g., '#2563EB')")

@tool(args_schema=SetThemeColorSchema)
def setThemeColor(themeColor: str):
    """
    Changes the primary theme color of the website.
    """
    return f"Theme color changed to {themeColor}."

class DeleteCardSchema(BaseModel):
    id: Optional[str] = Field(None, description="The ID of the card to delete")
    title: Optional[str] = Field(None, description="The title of the card to delete (if ID is unknown)")

@tool(args_schema=DeleteCardSchema)
def delete_card(id: str = None, title: str = None):
    """
    Deletes a card/widget from the screen.
    Use this when the user asks to remove, close, or delete a card.
    """
    return "Card deleted."

# ============================================================
# 4. STATE MANAGEMENT
# ============================================================

class AgentState(CopilotKitState):
    """
    Agent state schema. Store session-specific data here.
    """
    pass

# ============================================================
# 5. AGENT CONFIGURATION
# ============================================================

agent = create_agent(
    model="gpt-4.1",
    tools=[
        # Data Tools (Pure Functions)
        search_knowledge_base,
        
        # Universal UI Tool (The Bridge)
        render_ui,
        show_dynamic_card,  # Alias for backwards compatibility
        
        # Action Tools (State Mutations)
        setThemeColor,
        delete_card,
    ],
    middleware=[CopilotKitMiddleware()],
    state_schema=AgentState,
    system_prompt=AGENT_PROMPT2
)

graph = agent
