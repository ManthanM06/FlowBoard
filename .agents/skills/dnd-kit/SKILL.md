---
name: dnd-kit
description: Guidelines for building accessible multi-column drag-and-drop Kanban boards using @dnd-kit/core and @dnd-kit/sortable.
---
# dnd-kit Sortable Skill
- Use `@dnd-kit/core` and `@dnd-kit/sortable` for all card and column drag operations.
- Ensure proper sensor initialization (PointerSensor, KeyboardSensor).
- Implement custom collision detection algorithms (rectIntersection / closestCorners) for multi-container Kanban boards.
- Maintain strict React state immutability when reordering task cards.
