# design.md — FlowBoard Design System

You hadn't picked a direction, so here's a concrete one: **professional, not generic** — avoiding the default "blue accent on white card" SaaS look that every Trello-clone tutorial converges on. The idea: a warm, ink-and-paper feel with one confident accent color, instead of the cool corporate-blue palette everyone reaches for by default.

Treat this as a starting point — swap the accent hue if it clashes with taste, but keep the *structure* (one neutral scale, one accent, disciplined use of both).

## 1. Concept: "Studio Ledger"
Think of a well-kept paper ledger or a design studio's whiteboard — warm off-whites and near-blacks instead of pure `#000`/`#fff`, with a single confident accent color used sparingly for actions and priority, not everywhere. This reads as considered and calm rather than "default component library."

## 2. Color Palette

### Neutrals (base — used for 90% of the UI)
| Token | Hex | Use |
|---|---|---|
| `--bg-canvas` | `#F6F4EF` | App background (warm off-white, not stark white) |
| `--bg-surface` | `#FFFFFF` | Cards, panels, modals |
| `--bg-sunken` | `#EDEAE2` | Column backgrounds (recessed, so cards visually "sit in" them) |
| `--border-subtle` | `#E2DED3` | Card borders, dividers |
| `--text-primary` | `#1C1A16` | Near-black, warm-toned — headings, primary text |
| `--text-secondary` | `#6B6558` | Muted warm gray — metadata, timestamps, labels |
| `--text-disabled` | `#B3AC9C` | Placeholder text, disabled states |

### Accent — Ink Indigo
| Token | Hex | Use |
|---|---|---|
| `--accent` | `#3A3358` | Primary actions, links, active states, focus rings |
| `--accent-hover` | `#4A4270` | Hover state for accent elements |
| `--accent-subtle` | `#EBE9F2` | Accent-tinted backgrounds (selected column, active tab) |

Why indigo-ink instead of the usual SaaS blue (`#3B82F6`-family): it's still calm and professional, but reads distinct in a portfolio review — a small deliberate choice that signals design intent rather than "picked the framework default."

### Semantic (priority & status — used narrowly, on chips/dots only, never as large fills)
| Token | Hex | Use |
|---|---|---|
| `--priority-low` | `#5B8A72` (muted sage green) | Low priority tag |
| `--priority-medium` | `#C08A3E` (muted ochre) | Medium priority tag |
| `--priority-high` | `#B5533C` (muted terracotta red) | High priority tag |
| `--status-success` | `#4C7A5E` | Success toasts, "done" indicators |
| `--status-error` | `#A8433A` | Error toasts, destructive-action confirm |

**Rule**: semantic colors appear as small dots, chips, or thin left-borders on cards — never as full card backgrounds. Keeps the board visually calm even when priorities are mixed.

### Dark mode (optional, Phase 9 stretch)
Invert the neutral scale (`--bg-canvas: #1C1A16`, `--text-primary: #F6F4EF`), keep the accent and semantic hues as-is but slightly desaturate/lighten them (~10%) for contrast on dark backgrounds. Don't just flip to a generic dark-gray — keep the same warm undertone.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| UI / body | **Inter** *or*, for more character, **Public Sans** | Public Sans is a strong, less-overused alternative to Inter with similar legibility — worth trying first for differentiation |
| Headings | Same family as body, but weight 600–700, tighter letter-spacing (-0.01em) | Avoid a separate display font — one family, disciplined weight/size scale reads more "designed," not less |
| Monospace (task IDs, code-like metadata, e.g. `TASK-142`) | **JetBrains Mono** or **IBM Plex Mono** | Gives task IDs and timestamps a slightly technical, "tool for builders" feel |

### Type scale (base 16px)
| Token | Size / Line-height | Use |
|---|---|---|
| `--text-xs` | 12px / 16px | Metadata, timestamps, badge labels |
| `--text-sm` | 14px / 20px | Secondary text, card descriptions |
| `--text-base` | 16px / 24px | Body text, card titles |
| `--text-lg` | 18px / 26px | Section headers within a board |
| `--text-xl` | 22px / 30px | Board title |
| `--text-2xl` | 28px / 36px | Page-level headings (dashboard, workspace name) |

Weight usage: 400 for body, 500 for card titles/labels, 600 for headings — avoid 700+ except for the single largest heading on a page, to keep the UI feeling calm rather than shouty.

## 4. Spacing, Radius & Elevation (so components don't look like defaults)
- **Spacing scale**: 4px base unit (4/8/12/16/24/32/48px) — consistent, not arbitrary.
- **Corner radius**: 8px for cards, 6px for buttons/inputs, 4px for chips/badges. Slightly tighter than the common 12–16px "bubbly" default — reads more precise/professional.
- **Elevation**: avoid heavy drop shadows. Use a 1px `--border-subtle` border on cards by default; reserve a soft shadow (`0 2px 8px rgba(28,26,22,0.08)`) only for elements actively being dragged or for modals — this makes the drag state feel distinctly "lifted" rather than every card looking artificially elevated.

## 5. Component Notes
- **Drag state**: dragged card gets `--bg-surface` + shadow + a subtle `1.02` scale transform, and the drop-target column gets a `--accent-subtle` background tint — clear visual feedback without gimmicky animation.
- **Priority indicator**: a 3px colored left-border on the card, not a colored badge in the corner — quieter, still scannable.
- **Buttons**: primary = solid `--accent` fill, white text; secondary = `--border-subtle` outline, `--text-primary` text, transparent fill. Avoid a third "tertiary" button style — two is enough and keeps hierarchy clear.
- **Empty states**: use short, human copy ("No cards yet — add one to get started") rather than generic "No data available," and keep illustrations (if any) simple line-art in `--text-secondary`, not colorful stock graphics — keeps the professional tone consistent.
