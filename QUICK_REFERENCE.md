# Quick Reference Card

## 🚀 Starting the Application

### Every Time You Want to Use the App:

1. **Start the server:**
   ```bash
   # Double-click this file:
   start-server.bat

   # OR open terminal and run:
   cd D:\ProcessFlowDesigner
   python -m http.server 8000
   ```

2. **Open browser:**
   ```
   http://localhost:8000
   ```

3. **Done!** The app is now running.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | New workflow |
| **Ctrl+O** | Open workflow |
| **Ctrl+S** | Save workflow |
| **Delete** | Delete selected items |
| **+** | Zoom in |
| **-** | Zoom out |
| **Ctrl+0** | Reset zoom to 100% |
| **Escape** | Clear selection |
| **Space + Drag** | Pan canvas |

---

## 🖱️ Mouse Actions

| Action | Result |
|--------|--------|
| **Drag node from sidebar** | Create new node |
| **Click + drag node** | Move node |
| **Click node/connection** | Select it |
| **Double-click node** | Edit label |
| **Drag from node to node** | Create connection |
| **Mouse wheel** | Zoom in/out |
| **Middle mouse + drag** | Pan canvas |
| **Space + drag** | Pan canvas |

---

## 📋 Common Tasks

### Create a Workflow
1. Drag "Start" node onto canvas
2. Add Task nodes
3. Add Decision node
4. Add End node
5. Connect nodes by dragging between them
6. Double-click nodes to edit labels

### Save Workflow
- **Auto-save:** Happens automatically every 5 seconds → LocalStorage
- **Export JSON:** Click "Save" button → Downloads .json file
- **Load JSON:** Click "Open" button → Select .json file

### Navigate Canvas
- **Zoom:** Mouse wheel or +/- buttons
- **Pan:** Hold Space and drag, or middle mouse button
- **Reset:** Click ↺ button or Ctrl+0

---

## ❌ Common Issues

### "CORS policy" Error
➜ **Solution:** Use `start-server.bat` or run web server

### Drag & Drop Not Working
➜ **Solution:** Make sure you're on `http://localhost:8000` (not `file://`)

### Nothing Saves
➜ **Solution:** Check browser is not in private/incognito mode

### Blank Page
➜ **Solution:** Press F12, check Console for errors

---

## 🆘 Quick Debug

Open console (F12) and run:

```javascript
// Check if app loaded
ProcessFlowDesigner

// Get current state
ProcessFlowDesigner.stateManager.getState()

// Manually create a node
ProcessFlowDesigner.stateManager.addNode({
    type: 'start',
    label: 'Test',
    x: 200,
    y: 200,
    width: 80,
    height: 80,
    color: '#4CAF50',
    strokeColor: '#2E7D32'
})

// Check storage
ProcessFlowDesigner.storage.getStorageInfo()
```

---

## 📁 Files You Need to Know

| File | Purpose |
|------|---------|
| `start-server.bat` | **START HERE** - Launches web server |
| `README.md` | Full documentation |
| `QUICKSTART.md` | Verification checklist |
| `js/config.js` | Customize colors, zoom limits, etc. |

---

## 🎯 Sample Workflow to Test

Try creating this approval workflow:

```
[Start] → [Validate Input] → [Valid?]
                               ↓ Yes    ↓ No
                          [Process] [Reject]
                               ↓         ↓
                               → [End] ←
```

1. Create 6 nodes (Start, Task, Decision, Task, Task, End)
2. Position them left to right
3. Connect with arrows
4. Edit labels
5. Test save/load

---

## 🌐 Server Status

Server running? Check: **http://localhost:8000**

Server started: Look for this message:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

Stop server: **Ctrl+C** in terminal

---

## ✅ Verification Checklist

After starting the app:

- [ ] No CORS errors in console
- [ ] Can drag nodes onto canvas
- [ ] Nodes are visible on canvas
- [ ] Can create connections
- [ ] Can edit labels (double-click)
- [ ] Can zoom and pan
- [ ] Status bar shows correct counts
- [ ] Auto-save indicator pulses

If all checked ✅ = App is working perfectly!

---

**🎉 You're all set! Start creating workflows!**
