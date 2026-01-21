# Custom Agentic AI Website Plan

This plan targets a fully custom build with React + Vite on the frontend,
Python on the backend, and LiveKit for realtime voice.

## Step 1: Define the product flow and UI contract
- Map the user journey into discrete cards (steps or states).
- Define the agent to UI event contract:
  - Events: next_card, prev_card, highlight, repeat, pause, end_session.
  - Payload: cardId, section, emphasis, reason, timestamp.
- Write expected UI behaviors for each event.

## Step 2: Choose the production tech stack
- Frontend: React + Vite, TypeScript, Tailwind or CSS Modules.
- Voice and realtime: LiveKit WebRTC.
- Backend: Python (FastAPI) + WebSocket.
- Agent runtime: Python service for LiveKit Agent.
- LLM: OpenAI Responses API or Anthropic.
- STT/TTS: LiveKit plugins or OpenAI / Deepgram / ElevenLabs.
- State and storage: Redis for sessions, Postgres for long-term data.
- Observability: OpenTelemetry + Grafana or Sentry.

## Step 3: System architecture
- Frontend
  - UI shell and card renderer.
  - Voice session controller (connect, mute, end).
  - WebSocket client to receive agent events.
  - Optional LiveKit data/RPC listener for UI events.
- Backend
  - Session manager (auth, session state, card state).
  - Agent orchestrator (LLM prompt + rules).
  - Event dispatcher to the frontend (WebSocket).
- Voice pipeline
  - Client connects to LiveKit room.
  - Agent joins the room, listens to audio, and replies.
  - Agent emits structured UI events over WebSocket or LiveKit data/RPC.

## Step 4: Data and session design
- Session schema
  - sessionId, userId, currentCardId, history, preferences, status.
- Storage
  - Redis for active sessions and ephemeral state.
  - Postgres for user profiles and analytics.

## Step 5: API and realtime interfaces
- REST endpoints
  - POST /api/session/start
  - POST /api/session/end
  - POST /api/session/message (text fallback)
- WebSocket channel
  - /ws/session/{sessionId} for agent to UI events.
- LiveKit
  - Token endpoint to join a room.
  - Optional LiveKit RPC or data channel for UI events.

## Step 6: Agent behavior specification
- Prompt structure
  - System rules: always emit UI events for navigation.
  - Inputs: currentCardId, card content, user intent.
  - Allowed actions: next_card, prev_card, highlight, repeat, pause, end_session.
- Guardrails
  - If intent unclear, ask for clarification.
  - If user says skip, emit next_card.
  - If user says repeat, emit repeat.

## Step 7: Frontend implementation
- Build card components and a card registry keyed by cardId.
- Implement event handlers to advance cards or highlight sections.
- Add voice controls with mic permissions and connection state.
- Add accessibility fallback with a text input.

## Step 8: LiveKit integration
- Create LiveKit room and token service in backend.
- Use livekit-client in React to connect and stream audio.
- Run a Python LiveKit Agent service to handle audio and speech.
- Emit structured events to frontend via WebSocket.
- Optional: emit UI events via LiveKit RPC or data channel.

## Step 9: Security and privacy
- Consent prompt for microphone access.
- Auth tokens for session and LiveKit room access.
- Logging policy with retention limits.

## Step 10: Testing and QA
- Mock agent events to test UI without voice.
- Load test WebSocket event stream.
- Test mobile browsers for mic permissions and latency.

## Step 11: Deployment and rollout
- Staging environment with a feature flag for voice.
- Monitor latency, dropout rate, and completion rate.
- Gradual rollout to production with metrics.

## Event flow example
1. User clicks Start voice guide.
2. Frontend requests session from backend.
3. Backend returns sessionId and LiveKit token.
4. Frontend joins LiveKit room and connects WebSocket.
5. Agent listens, responds by voice, emits next_card event.
6. Frontend renders next card and highlights sections.

## UI control from LiveKit audio
- Use a dual-channel model: audio via LiveKit, UI events via WebSocket or LiveKit
  data/RPC.
- The agent is the source of truth for UI events after retrieval from the
  vector database.
- The frontend never infers UI changes from audio; it only reacts to events.

## Python UI event example (agent -> backend WS)
```py
import asyncio
import json
import websockets


async def send_ui_event(session_id: str, payload: dict) -> None:
    url = f"wss://api.example.com/ws/session/{session_id}"
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps(payload))


async def on_agent_decision(session_id: str) -> None:
    payload = {
        "type": "show_card",
        "cardId": "pricing_intro",
        "title": "Pricing Overview",
        "imageUrl": "/images/pricing.png",
        "sections": ["basic", "pro"],
        "reason": "user asked about cost",
    }
    await send_ui_event(session_id, payload)


if __name__ == "__main__":
    asyncio.run(on_agent_decision("session_123"))
```

## LiveKit RPC example (from LiveKit JS SDK docs)
```ts
import { Room } from 'livekit-client';

const room = new Room();

room.localParticipant?.registerRpcMethod('ui_event', async (data) => {
  console.log('UI event payload:', data.payload);
  return 'ok';
});

await room.localParticipant?.performRpc({
  destinationIdentity: 'agent',
  method: 'ui_event',
  payload: JSON.stringify({ type: 'next_card', cardId: 'intro' }),
});
```
