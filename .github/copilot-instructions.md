# Copilot Instructions — Enterprise Architecture Draw Studio

You are helping build **Enterprise Architecture Draw Studio**, a Creative Apps hackathon project.

## Product Vision

"Turn enterprise ideas into navigable architecture diagrams with AI-assisted reasoning."

## Core UX Principle

**Zero friction.** The user should not manually create boxes first. The user describes business context in natural language, and the app organizes it into: mission, vision, value chain, process, bottlenecks, gaps, risks, recommendations, and solution options.

This is **not a generic diagramming tool**. It is a **living enterprise architecture workspace**.

## Design Principles

Every visual element should represent meaningful architecture information:
- meaning
- properties
- context
- relationships
- evidence
- impact
- traceability
- navigation

## Implementation Strategy

**Important product belief:** Not every gap needs software. The right solution may be process redesign, checklist, automation, integration, dashboard, manual tool, or application.

### Priorities

1. Clean, modern SaaS UI
2. Left navigation/sidebar
3. Top toolbar
4. Central navigable canvas
5. Right AI-assisted reasoning/properties panel
6. Static-first demo using structured mock data
7. Clickable navigation between sections
8. Clear, polished, demoable experience

### Avoid

- Overengineering
- Authentication
- Backend
- Database
- Real external APIs
- Confidential data
- Secrets
- Unnecessary complexity

## Code Guidelines

- Keep code simple, readable, modular, and safe
- Use React + TypeScript for type safety
- Use Tailwind CSS for styling
- Organize components by feature (Layout, Elements, etc.)
- Store mock data separately from components
- Define types explicitly in `src/types/`
- Use utility functions for shared logic

## Project Structure

```
src/
  components/
    Layout/         # Main layout components (Sidebar, Toolbar, Canvas, PropertiesPanel)
    Elements/       # Element-specific components
  data/
    mockData.ts     # Static demo data
  utils/
    elementUtils.ts # Shared utility functions
  types/
    index.ts        # TypeScript type definitions
  App.tsx           # Main app component
  main.tsx          # Entry point
  index.css         # Global styles
```

## Architecture Data Model

Each **ArchitectureElement** has:
- `id`: unique identifier
- `type`: mission | vision | value_chain | process | bottleneck | gap | risk | recommendation | solution
- `title`, `description`, `context`: content
- `properties`: domain-specific key-value pairs
- `relationships`: parent/child/related elements
- `evidence`: supporting facts
- `impact`: business consequence

Elements are organized hierarchically and displayed by type on the canvas.

## Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build demo with more architecture scenarios
4. Add AI reasoning panel (future)
5. Implement natural language input (future)
