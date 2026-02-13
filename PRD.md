PRODUCT REQUIREMENTS DOCUMENT (PRD)
Product Name: Process Flow Designer
Type: Static Web Application (GitHub Pages Deployable)
1. Product Overview
1.1 Purpose
The Process Flow Designer is a fully client-side, static web application that allows users (primarily IT Business Analysts, Project Managers, and Product Owners) to visually design, edit, and export process workflows.

The tool must:

Run entirely in the browser

Require no backend

Store data locally (JSON, LocalStorage, file export)

Be deployable via GitHub Pages

Feel like a lightweight SaaS tool

2. Goals & Non-Goals
2.1 Goals
Provide intuitive drag-and-drop workflow creation

Allow connecting nodes with arrows

Support node customization (color, label, type)

Export workflows as JSON and PNG/SVG

Be clean, professional, and portfolio-ready

Be modular and scalable for advanced features

Support large workflows (zoom/pan/minimap)

2.2 Non-Goals
No backend server

No real-time collaboration

No database

No user authentication

No cloud sync

3. Target Users
Primary:

IT Business Analysts

Product Managers

Project Managers

Secondary:

Students learning process modeling

Portfolio reviewers

4. Technical Constraints
Must use:

HTML5

CSS3

Vanilla JavaScript (ES6+)

Lightweight libraries allowed (optional):

interact.js (drag/drop)

SVG.js or native SVG

html2canvas (for export)

Must be deployable on GitHub Pages

No Node backend required for production

All data stored locally (LocalStorage + JSON file export)

5. System Architecture
5.1 High-Level Architecture
index.html

/css/styles.css

/js/app.js

/js/modules/

canvas.js

nodes.js

connections.js

stateManager.js

exportManager.js

undoRedo.js

layoutEngine.js

metrics.js

/assets/icons/

5.2 Data Model (JSON Structure)
Workflow Object:

{
  "id": "workflow-001",
  "name": "My Workflow",
  "version": "1.0",
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "label": "Start Process",
      "color": "#4CAF50",
      "x": 120,
      "y": 80,
      "notes": "",
      "locked": false,
      "groupId": null
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "node-1",
      "to": "node-2",
      "label": "Yes",
      "style": "solid"
    }
  ],
  "metadata": {
    "createdAt": "",
    "updatedAt": "",
    "zoomLevel": 1,
    "canvasOffset": { "x": 0, "y": 0 }
  }
}
6. Core Functional Requirements
6.1 Canvas
Large scrollable workspace

Infinite canvas simulation

Grid background (toggleable)

Snap-to-grid optional

Zoom (25%–200%)

Pan via:

Middle mouse drag OR

Space + drag

6.2 Nodes
Types
Start (circle, green default)

Task (rounded rectangle, blue default)

Decision (diamond, yellow default)

End (circle, red default)

Node Properties
ID (auto-generated)

Type

Label (editable inline)

Color (customizable)

X/Y coordinates

Notes

Locked (boolean)

Group ID

Node Behavior
Drag to reposition

Double-click to edit label

Click to select

Shift-click for multi-select

Delete via:

Delete key

Context menu

Node Customization
Color picker

Icon option (optional)

Shape defined by type

Custom node templates allowed

6.3 Connections
Drawn via click-drag from anchor point

SVG-based lines

Arrowheads

Types:

Solid

Dashed

Curved

Connection Properties
From Node ID

To Node ID

Label

Style

ID

Behavior
Click to select

Delete with Delete key

Drag endpoints to reconnect

Label editable inline

6.4 State Management
Central state object

All changes update state

Re-render only affected elements

Autosave to LocalStorage every 5 seconds

6.5 Undo / Redo
Stack-based action tracking

Track:

Node creation

Node deletion

Move

Color change

Connection creation/deletion

Minimum 50-step history

6.6 Export & Save
Export Options
JSON file

PNG

SVG

HTML embed

Save/Load
Load JSON file

Save JSON file

Auto-save to LocalStorage

7. Advanced Functional Requirements
7.1 Mini Map
Displays scaled version of canvas

Shows viewport rectangle

Click to navigate

7.2 Search & Filter
Search by:

Label

Type

Filter by:

Node type

Color

7.3 Metrics Panel
Display:

Total nodes

Total connections

Decision count

Locked nodes

Zoom level

Version

7.4 Node Grouping
Select multiple nodes

Assign group ID

Group move

Optional background highlight

7.5 Auto Layout
Trigger button

Simple vertical flow layout

Maintain connection integrity

7.6 Versioning
Manual version increment

Save versions in memory

Revert to previous

7.7 Theme Support
Light mode (default)

Dark mode

Toggle stored in LocalStorage

8. UI/UX Requirements
8.1 Layout Structure
Top Toolbar:

New

Open

Save

Export

Undo

Redo

Auto Layout

Theme toggle

Left Sidebar:

Node types

Templates

Color picker

Main Canvas:

Large grid workspace

Mini-map in corner

Bottom Status Bar:

Metrics display

8.2 Visual Style
Clean, minimal

Subtle shadows

Rounded corners

Professional color palette

Smooth animations

9. Performance Requirements
Must support:

200+ nodes

300+ connections

No noticeable lag

Re-render optimized

Avoid full DOM redraw

10. Accessibility
Keyboard navigation

High contrast theme

ARIA labels

Focus states visible

11. Error Handling
Prevent connection to self

Prevent duplicate connection

Show error toast messages

Validate JSON before loading

12. Deployment
Must work on GitHub Pages

No build step required

All assets relative paths

No server dependencies

13. Milestone Planning Required from Claude
Claude should:

Propose architecture refinement

Break into development tasks

Organize tasks into:

Phase 1 (MVP)

Phase 2 (Enhancements)

Phase 3 (Advanced)

Identify reusable modules

Suggest libraries (if necessary)

Provide estimated complexity per feature

Suggest testing strategy

Provide folder structure

Suggest UI component hierarchy

Provide implementation order

14. Success Criteria
User can:

Build a workflow

Customize nodes

Connect nodes

Save and load

Export

No backend required

Works smoothly on Chrome, Edge, Firefox

Looks portfolio-ready