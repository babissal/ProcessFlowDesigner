# Process Flow Designer

A fully client-side visual workflow designer built with vanilla JavaScript, HTML5, and CSS3. Create, edit, and export process flow diagrams with an intuitive drag-and-drop interface.

![Process Flow Designer](wireframe.jpg)

## 🚀 Features (Phase 1 - MVP)

### Core Functionality
- ✅ **Visual Canvas**: Infinite zoomable/pannable canvas with grid background
- ✅ **4 Node Types**: Start (green circle), Task (blue rectangle), Decision (yellow diamond), End (red circle)
- ✅ **Drag & Drop**: Drag nodes from palette onto canvas
- ✅ **Node Editing**: Double-click nodes to edit labels inline
- ✅ **Connections**: Click-drag to create connections between nodes with arrowheads
- ✅ **Selection**: Click to select nodes or connections
- ✅ **Delete**: Press Delete key to remove selected items
- ✅ **Zoom Controls**: Mouse wheel, +/- buttons, or Ctrl+0 to reset
- ✅ **Pan Canvas**: Space + drag or middle mouse button

### Save & Export
- ✅ **JSON Export/Import**: Save and load workflows as JSON files
- ✅ **Auto-save**: Automatically saves to LocalStorage every 5 seconds
- ✅ **Persistence**: Workflow restored on page reload

### User Experience
- ✅ **Professional UI**: Clean, modern interface matching wireframe
- ✅ **Keyboard Shortcuts**: Ctrl+N (new), Ctrl+O (open), Ctrl+S (save), Delete (delete)
- ✅ **Status Bar**: Real-time statistics (node count, connection count, zoom level)
- ✅ **Toast Notifications**: Success/error feedback
- ✅ **Confirmation Dialogs**: Prevent accidental data loss

## 📋 Technology Stack

- **Vanilla JavaScript (ES6+)**: No frameworks, pure JavaScript modules
- **SVG**: Scalable vector graphics for rendering
- **interact.js**: Robust drag-and-drop interactions
- **LocalStorage**: Client-side persistence
- **No Backend Required**: Runs entirely in the browser

## 🎯 Getting Started

### Installation

1. Clone or download this repository
2. **Start a local web server** (required for ES6 modules)
3. Open in browser at `http://localhost:8000`

**⚠️ IMPORTANT:** Do not open `index.html` directly (file:// protocol). ES6 modules require a web server due to CORS security restrictions.

### Starting the Local Server

**Windows (Easy):**
```bash
# Double-click this file:
start-server.bat

# OR run in terminal:
python -m http.server 8000
```

**Mac/Linux:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Alternative (Node.js):**
```bash
npx http-server -p 8000
```

Then open: **http://localhost:8000**

### Deployment (GitHub Pages)

1. Push the repository to GitHub
2. Go to Settings → Pages
3. Select branch and root folder
4. Your app will be live at `https://yourusername.github.io/ProcessFlowDesigner`

## 🎨 Usage Guide

### Creating a Workflow

1. **Add Nodes**: Drag node types from the left sidebar onto the canvas
2. **Position Nodes**: Click and drag nodes to reposition them
3. **Create Connections**: Click and drag from one node to another
4. **Edit Labels**: Double-click a node to edit its label
5. **Select Items**: Click on nodes or connections to select them
6. **Delete Items**: Select items and press Delete key

### Canvas Navigation

- **Zoom**: Mouse wheel or use +/- buttons in toolbar
- **Pan**: Hold Space and drag, or use middle mouse button
- **Reset View**: Click the reset button (↺) or press Ctrl+0

### Saving & Loading

- **Auto-save**: Workflow automatically saves to LocalStorage every 5 seconds
- **Export JSON**: Click "Save" or "Export JSON" button to download workflow file
- **Import JSON**: Click "Open" button and select a workflow JSON file
- **New Workflow**: Click "New" button (warns if unsaved changes exist)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New workflow |
| `Ctrl+O` | Open workflow |
| `Ctrl+S` | Save workflow |
| `Delete` | Delete selected items |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `Escape` | Clear selection |

## 📁 Project Structure

```
ProcessFlowDesigner/
├── index.html                          # Main entry point
├── css/
│   ├── styles.css                      # Base styles
│   ├── toolbar.css                     # Toolbar styling
│   ├── sidebar.css                     # Sidebar styling
│   ├── canvas.css                      # Canvas styling
│   ├── nodes.css                       # Node styling
│   ├── connections.css                 # Connection styling
│   ├── statusbar.css                   # Status bar styling
│   └── modals.css                      # Modal and toast styling
├── js/
│   ├── app.js                          # Application bootstrap
│   ├── config.js                       # Configuration constants
│   ├── modules/
│   │   ├── eventBus.js                 # Event pub/sub system
│   │   ├── stateManager.js             # State management
│   │   ├── canvas.js                   # Zoom/pan functionality
│   │   ├── nodes.js                    # Node management
│   │   ├── connections.js              # Connection management
│   │   ├── toolbar.js                  # Toolbar interactions
│   │   ├── sidebar.js                  # Sidebar palette
│   │   ├── exportManager.js            # Export/import handling
│   │   └── storage.js                  # LocalStorage persistence
│   └── utils/
│       ├── geometry.js                 # Math utilities
│       ├── svg.js                      # SVG helpers
│       ├── dom.js                      # DOM utilities
│       └── debounce.js                 # Debounce function
├── assets/
│   └── templates/
│       └── sample-workflow.json        # Example workflow
├── PRD.md                              # Product Requirements Document
├── wireframe.jpg                       # UI wireframe
└── README.md                           # This file
```

## 🏗️ Architecture

### Core Patterns

- **Event-Driven Architecture**: Modules communicate via EventBus
- **Immutable State**: StateManager ensures predictable state updates
- **Modular Design**: Each module has a single responsibility
- **Observer Pattern**: Components subscribe to state changes

### State Management

All application state is managed centrally by `StateManager`:

```javascript
{
  workflow: {
    id: 'workflow-001',
    name: 'My Workflow',
    nodes: [...],
    connections: [...],
    metadata: {...}
  },
  ui: {
    selectedNodes: [],
    selectedConnections: [],
    theme: 'light',
    gridVisible: true
  }
}
```

### Event System

Modules communicate through `EventBus`:

```javascript
// Subscribe to events
eventBus.on('node:added', (node) => {
  // Handle node addition
});

// Emit events
eventBus.emit('node:added', newNode);
```

## 🔧 Configuration

Edit `js/config.js` to customize:

- Canvas zoom limits and sensitivity
- Node colors and sizes
- Connection styles
- Auto-save interval
- Validation rules
- Keyboard shortcuts

## 🌐 Browser Support

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 📝 Data Format

Workflows are saved in JSON format:

```json
{
  "id": "workflow-001",
  "name": "My Workflow",
  "version": "1.0",
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "label": "Start",
      "x": 100,
      "y": 100,
      "width": 80,
      "height": 80,
      "color": "#4CAF50"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "node-1",
      "to": "node-2",
      "label": "",
      "style": "solid"
    }
  ],
  "metadata": {
    "createdAt": "2026-02-12T...",
    "updatedAt": "2026-02-12T...",
    "zoomLevel": 1.0,
    "canvasOffset": { "x": 0, "y": 0 }
  }
}
```

## 🔧 Troubleshooting

### CORS Error / Modules Not Loading

**Error:** `Access to script at 'file://...' has been blocked by CORS policy`

**Solution:** You must use a web server. Do not open `index.html` directly.

1. Start local server: `python -m http.server 8000`
2. Open: `http://localhost:8000`

### Blank Page / Nothing Appears

**Possible causes:**
1. Not using a web server → Start server (see above)
2. JavaScript errors → Check browser console (F12)
3. interact.js CDN failed → Check internet connection

### Drag and Drop Not Working

**Solutions:**
1. Make sure you're using `http://localhost:8000` (not `file://`)
2. Check console for errors (F12)
3. Verify interact.js loaded (Network tab in DevTools)

### Nothing Saves / LocalStorage Errors

**Solutions:**
1. Enable cookies/storage in browser settings
2. Disable private/incognito mode
3. Check storage quota (console: `ProcessFlowDesigner.storage.getStorageInfo()`)

## 🐛 Debugging

Access the application instance in browser console:

```javascript
// Get current state
ProcessFlowDesigner.stateManager.getState()

// Get workflow data
ProcessFlowDesigner.stateManager.getWorkflow()

// Emit events
ProcessFlowDesigner.eventBus.emit('event:name', data)

// Check storage
ProcessFlowDesigner.storage.getStorageInfo()
```

## 🚧 Future Enhancements (Phase 2 & 3)

### Phase 2 Features
- Undo/Redo functionality
- Multi-select (Shift+Click)
- Mini-map navigation
- Curved connection lines
- PNG/SVG export
- Node color picker
- Connection labels
- Grid snap

### Phase 3 Features
- Auto-layout algorithm
- Dark mode theme
- Node grouping
- Workflow versioning
- Advanced metrics panel
- Accessibility improvements
- Performance optimization

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Contributing

This is a standalone project. Feel free to fork and customize for your needs.

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify browser compatibility
3. Try clearing LocalStorage: `localStorage.clear()`
4. Review the PRD.md for detailed specifications

---

**Built with ❤️ using vanilla JavaScript**

No frameworks. No build tools. Just clean, modern web development.
