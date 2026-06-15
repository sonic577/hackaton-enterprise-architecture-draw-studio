# Enterprise Architecture Draw Studio

Enterprise Architecture Draw Studio is a web application for visually modeling enterprise architecture, operational processes, and agent-based systems through an interactive diagram canvas.

The project combines a draw-style visual editor with AI-assisted architecture generation. Users can describe a business case, mission, process, risk, or operational flow in natural language, and the application converts it into structured diagrams, nodes, connectors, nested BPMN views, and documentation-ready outputs.

## Hackathon Context

This project was created for the Microsoft Agents League Hackathon.

It explores how AI-assisted development and Microsoft agent technologies can help teams move faster from business context to enterprise architecture models, process diagrams, and implementation-ready documentation.

## Problem

Designing enterprise architecture and agent-based solutions is often slow and fragmented. Business context usually lives in text documents, meetings, prompts, spreadsheets, and disconnected diagrams.

Teams need a faster way to:

* Capture business context.
* Identify mission, vision, objectives, processes, gaps, risks, and recommendations.
* Convert natural language into structured architecture.
* Navigate between high-level architecture and detailed process views.
* Keep diagrams editable, explainable, and reusable.

## Solution

Enterprise Architecture Draw Studio provides a visual workspace where users can create, edit, organize, and generate architecture diagrams.

The application supports:

* Enterprise architecture modeling.
* Business process modeling.
* Nested BPMN diagrams.
* AI-assisted Quick Capture from natural language.
* Local deterministic analysis mode.
* Optional Microsoft Foundry integration.
* Exportable documentation.
* JSON-based project save and load.

## Key Features

* Interactive diagram canvas with node selection, drag, resize, and connectors.
* Editable diagram tree with folders and multiple diagrams.
* Context menus for canvas, nodes, connectors, folders, and diagrams.
* Component library with Enterprise Architecture, TOGAF-inspired, BPMN, and free-form shapes.
* Inspector panel for editing nodes, connectors, and analysis metadata.
* Quick Capture using `/` to generate diagrams from natural language.
* Nested BPMN view under operational process nodes.
* Save and load complete projects as JSON.
* DOCX export and printable documentation view.
* Server-side Microsoft Foundry integration with safe mock fallback.

## Technologies

* React
* TypeScript
* Vite
* SVG-based interactive canvas
* Node.js
* Microsoft Foundry integration
* GitHub
* GitHub Copilot assisted development workflow

## Requirements

* Node.js 18 or higher
* npm

## Installation

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

By default, Vite starts the app at:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and complete only the values you need:

```env
AZURE_FOUNDRY_API_KEY=
AZURE_FOUNDRY_PROJECT_ENDPOINT=
AZURE_FOUNDRY_AGENT_ID=
AZURE_FOUNDRY_DEPLOYMENT=
ANALYSIS_MODE=mock
```

Available modes:

* `ANALYSIS_MODE=mock`: uses deterministic local generators. It does not call external services.
* `ANALYSIS_MODE=foundry`: calls Microsoft Foundry through the internal server-side endpoint and falls back to mock mode if the request fails.

Important: `AZURE_FOUNDRY_*` variables intentionally do not use the `VITE_` prefix to avoid exposing secrets in the frontend bundle. The `.env` file is ignored by Git.

## Main Usage

* Use the left component library to drag elements into the canvas.
* Use the `Diagrams` panel to create folders, create diagrams, rename, duplicate, and delete views.
* Select nodes or connectors to edit them from the right inspector.
* Drag node handles to resize or connect elements.
* Use Quick Capture with `/` to create diagrams from text.
* Press `Enter` in Quick Capture to generate.
* Press `Shift + Enter` to insert a new line.
* Use `Save Project` and `Load Project` to export/import the complete project as JSON.
* Use DOCX export or Print / Save as PDF for documentation.

## Quick Capture and AI

Quick Capture accepts natural language in English or Spanish.

Examples:

```text
Add the mission: become the most trusted pharmacy in the city by 2030.
```

```text
Mission: serve customers quickly. Process: receive order, check availability, prepare order, deliver.
```

```text
Create an enterprise architecture model for a pharmacy that wants to improve its delivery process, reduce waiting times, and organize its customer service operation.
```

For longer business or process cases, the app separates the model into:

* A main enterprise architecture view.
* A nested BPMN view under the `Current Process` node.

The main canvas remains readable with high-level elements such as context, objective, current process, gaps, risks, recommendations, solutions, and core components.

Operational steps, lanes, gateways, and sequence flows are placed in the child diagram `Current Process BPMN`.

## Microsoft Foundry Integration

The frontend calls the internal endpoint:

```text
POST /api/analyze-architecture
```

This endpoint is implemented in the Vite server-side middleware inside `vite.config.ts`.

Request example:

```json
{
  "text": "business case description",
  "currentDiagram": {}
}
```

Expected response:

```json
{
  "nodes": [],
  "connectors": [],
  "diagrams": [],
  "assumptions": [],
  "gaps": [],
  "risks": [],
  "recommendations": []
}
```

If Foundry returns markdown or extra text around the JSON, the server attempts to extract and parse the JSON safely.

If Foundry fails or is not configured, the application falls back to a local mock response so the demo remains functional.

The Enterprise Architecture Reasoning Agent prompt is documented in `docs/enterprise-architecture-reasoning-agent-prompt.md`.

## Project Architecture

```text
src/
  App.tsx                         Main project state, diagrams, save/load and actions.
  components/Layout/
    DiagramCanvas.tsx             SVG canvas, nodes, connectors, resize, menus and Quick Capture.
    DiagramExplorer.tsx           Editable tree of folders and diagrams.
    ComponentLibrary.tsx          Visual component palette.
    Inspector.tsx                 Node, connector and analysis properties.
    Toolbar.tsx                   Main actions.
  data/
    componentDefinitions.ts       TOGAF, BPMN and component metadata catalog.
    mockData.ts                   Initial demo diagrams.
  utils/
    quickCaptureIntent.ts         Local text interpretation, long cases and nested BPMN generation.
    foundryResponseParser.ts      Validation and conversion from Foundry JSON to nodes/connectors.
    analyzeArchitectureApi.ts     Frontend client for /api/analyze-architecture.
    mockDiagramGenerator.ts       Local deterministic generator.
    processAnalyzer.ts            Local process analysis.
    documentExport.ts             DOCX export and print/PDF support.
    elementUtils.tsx              Icons, colors and visual helpers.
  types/
    index.ts                      Main types for diagrams, nodes and connectors.
```

## Conceptual Model

* `Diagram`: contains nodes and connectors.
* `DiagramNode`: represents architecture elements, BPMN elements, free-form shapes, or notes.
* `DiagramConnector`: represents relationships or process flows between nodes.
* `linkedDiagramId`: allows a node to open a nested child diagram.
* `DiagramTreeItem`: represents the editable structure of the `Diagrams` panel, including folders and diagram references.

## Manual Testing Checklist

1. Run `npm install`.
2. Run `npm run dev`.
3. Open the app at `http://127.0.0.1:5173/`.
4. Open Quick Capture with `/`.
5. Type `Add the mission: become the most trusted pharmacy in the city by 2030` and press `Enter`.
6. Confirm that a Mission node is created.
7. Paste a longer business process case.
8. Confirm that a `Current Process` node is created with a nested BPMN child diagram.
9. Open the linked BPMN diagram from the node badge.
10. Create folders and diagrams from the `Diagrams` panel.
11. Move, resize, connect, and edit nodes.
12. Save the project as JSON.
13. Load the project again and confirm that the diagram tree and canvas are preserved.
14. Run `npm run build`.
15. Run `npm run preview`.

## Demo Video

Demo video link:

```text
Coming soon
```

Recommended maximum duration: 5 minutes.

## Architecture Diagram

Architecture diagram link or image:

```text
Coming soon
```

## Security Notes

* Do not commit real API keys.
* Do not store secrets in the repository.
* Do not use `VITE_` for secret values.
* `.env` is included in `.gitignore`.
* Foundry integration runs server-side through Vite middleware during development.
* Mock mode allows the app to run without external credentials.

## Current Limitations

* Foundry integration depends on valid project credentials and endpoint configuration.
* The server-side middleware is designed for development/demo usage.
* Production deployment should move the Foundry endpoint to a dedicated backend or serverless function.
* Real-time collaboration is not included in the current version.
* Advanced diagram validation and governance rules are part of the roadmap.

## Roadmap

* Azure deployment.
* Dedicated backend for production Foundry integration.
* Export diagrams as image or PDF.
* More architecture templates.
* Reusable agent governance templates.
* Rule-based architecture validation.
* Collaboration features.
* Integration with enterprise knowledge sources.
* Improved BPMN validation.
* Version history for architecture projects.

## Video

The project demo video is available here: https://youtu.be/ygZ4kHxFrJg

## License

MIT
