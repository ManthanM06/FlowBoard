---
name: nestjs-websockets
description: Architecture blueprints for NestJS Socket.IO gateways, room management, and Redis Pub/Sub scaling.
---
# NestJS WebSockets Skill
- Implement NestJS WebSocket Gateways using `@WebSocketGateway()` with Socket.IO.
- Scope real-time events to workspace rooms (`socket.join(workspaceId)`).
- Configure Redis Pub/Sub adapters (`@socket.io/redis-adapter`) to support multi-instance socket scaling.
- Protect all socket connections using JWT auth connection guards.
