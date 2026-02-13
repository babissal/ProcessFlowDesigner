# Quick Start Guide - Process Flow Designer

## ✅ Verification Checklist

After opening `index.html` in your browser, verify the following:

### 1. Initial Load
- [ ] Application loads without console errors (press F12 to open Developer Tools)
- [ ] Welcome overlay is displayed with instructions
- [ ] Toolbar is visible at the top
- [ ] Left sidebar shows 4 node types (Start, Task, Decision, End)
- [ ] Status bar at bottom shows "0 nodes, 0 connections, 100% zoom"

### 2. Basic Functionality

#### Create Nodes
- [ ] Drag "Start" node from sidebar onto canvas
- [ ] Welcome overlay disappears
- [ ] Green circle appears on canvas
- [ ] Status bar updates to "1 node"
- [ ] Node can be dragged around the canvas

#### Create More Nodes
- [ ] Add a Task node (blue rectangle)
- [ ] Add a Decision node (yellow diamond)
- [ ] Add an End node (red circle)
- [ ] All nodes can be repositioned

#### Create Connections
- [ ] Click and drag from Start node to Task node
- [ ] Connection line with arrow appears
- [ ] Status bar updates connection count
- [ ] Create more connections between nodes

#### Edit Labels
- [ ] Double-click on a node
- [ ] Text input appears
- [ ] Type new label and press Enter
- [ ] Label updates

#### Selection
- [ ] Click on a node - should highlight in blue
- [ ] Click on a connection - should highlight in blue
- [ ] Click on canvas background - selection clears

#### Delete
- [ ] Select a node
- [ ] Press Delete key
- [ ] Node and its connections are removed

### 3. Canvas Controls

#### Zoom
- [ ] Scroll mouse wheel - canvas zooms in/out
- [ ] Click + button - zooms in
- [ ] Click - button - zooms out
- [ ] Click ↺ button - resets to 100%
- [ ] Status bar shows current zoom percentage

#### Pan
- [ ] Hold Space and drag - canvas pans
- [ ] OR click middle mouse button and drag - canvas pans

### 4. Save & Load

#### Export
- [ ] Create a simple workflow (2-3 nodes with connections)
- [ ] Click "Save" or "Export JSON" button
- [ ] JSON file downloads (check your Downloads folder)

#### Import
- [ ] Click "Open" button
- [ ] Select the JSON file you just downloaded
- [ ] Workflow loads correctly

#### Auto-save
- [ ] Create some nodes
- [ ] Wait 5 seconds
- [ ] Green dot in status bar pulses (indicates auto-save)
- [ ] Refresh the page (F5)
- [ ] Workflow is restored automatically

### 5. Keyboard Shortcuts

- [ ] Ctrl+N - Creates new workflow (with confirmation if there's content)
- [ ] Ctrl+S - Exports workflow as JSON
- [ ] Delete - Deletes selected items
- [ ] + - Zooms in
- [ ] - - Zooms out
- [ ] Ctrl+0 - Resets zoom
- [ ] Escape - Clears selection

## 🐛 Troubleshooting

### Application doesn't load
1. Check browser console (F12) for errors
2. Make sure you're using a modern browser (Chrome, Edge, Firefox)
3. Check that interact.js CDN is accessible (requires internet connection)

### Console Errors
Look for specific error messages:
- `interact is not defined` → interact.js CDN failed to load, check internet connection
- `Module not found` → Check that all file paths are correct
- `localStorage is not available` → Enable localStorage in browser settings

### Nodes don't drag
1. Check that interact.js loaded successfully
2. Verify console for JavaScript errors
3. Try refreshing the page

### Nothing saves
1. Check that localStorage is enabled
2. Browser may be in private/incognito mode
3. Check browser storage quota

### Connections don't appear
1. Try creating connection from node to a different node (not same node)
2. Check if there's already a connection between those nodes
3. Check console for validation errors

## 🎯 Test Workflow Creation

Try creating this simple workflow to test all features:

1. **Start Node** (top-left)
   - Label: "Begin Process"

2. **Task Node** (middle)
   - Label: "Validate Input"

3. **Decision Node** (right)
   - Label: "Valid?"

4. **Task Node** (bottom-right, path 1)
   - Label: "Process Data"

5. **Task Node** (top-right, path 2)
   - Label: "Show Error"

6. **End Node** (far right)
   - Label: "Complete"

**Connections:**
- Start → Validate Input
- Validate Input → Valid?
- Valid? → Process Data (success path)
- Valid? → Show Error (error path)
- Process Data → Complete
- Show Error → Complete

**Expected Result:**
- A branching workflow with decision logic
- All nodes connected properly with arrows
- Labels clearly visible
- Can zoom/pan to view entire workflow
- Can export and re-import successfully

## ✨ Sample Workflow

A sample workflow is included at `assets/templates/sample-workflow.json`

To load it:
1. Click "Open" button
2. Navigate to `assets/templates/`
3. Select `sample-workflow.json`
4. Sample workflow with approval flow appears

## 📊 Performance Check

The application should perform smoothly with:
- ✅ Up to 50 nodes (Phase 1 target)
- ✅ Smooth zoom/pan at all zoom levels
- ✅ Instant node creation and dragging
- ✅ Fast connection rendering
- ✅ Auto-save without UI lag

## 🎓 Next Steps

After verifying basic functionality:

1. **Create Real Workflows**: Design your actual business processes
2. **Export & Share**: Save workflows as JSON files
3. **Explore Features**: Try all keyboard shortcuts
4. **Customize**: Edit `js/config.js` to change colors, sizes, etc.
5. **Deploy**: Host on GitHub Pages for team access

## 🔍 Developer Tools

Open browser console and type:

```javascript
// Get current state
ProcessFlowDesigner.stateManager.getState()

// View all nodes
ProcessFlowDesigner.stateManager.getNodes()

// View all connections
ProcessFlowDesigner.stateManager.getConnections()

// Check storage info
ProcessFlowDesigner.storage.getStorageInfo()
```

## ✅ Success Criteria

Your application is working correctly if:
- ✅ All items in verification checklist pass
- ✅ Test workflow can be created successfully
- ✅ Workflow persists after page refresh
- ✅ Export/import works correctly
- ✅ No console errors during normal use

---

**Congratulations! You now have a fully functional Process Flow Designer! 🎉**
