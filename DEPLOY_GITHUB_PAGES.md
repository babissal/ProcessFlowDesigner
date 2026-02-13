# Deploy to GitHub Pages

## 🚀 Quick Deployment Guide

### Prerequisites:
- GitHub account
- Git installed on your computer

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ProcessFlowDesigner` (or any name)
3. Description: "Visual workflow designer - drag and drop process flow editor"
4. **Public** (required for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

---

## Step 2: Initialize Local Git Repository

Open terminal in the project folder and run:

```bash
cd D:\ProcessFlowDesigner

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Process Flow Designer with Phase 2 features"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ProcessFlowDesigner.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

**That's it!** Your site will be live in 1-2 minutes at:
```
https://YOUR_USERNAME.github.io/ProcessFlowDesigner/
```

---

## ✅ Verification

After 2 minutes:

1. Visit: `https://YOUR_USERNAME.github.io/ProcessFlowDesigner/`
2. You should see the Process Flow Designer
3. Test all features:
   - ✅ Drag nodes from palette
   - ✅ Create connections with Connect tool
   - ✅ Undo/Redo works
   - ✅ Multi-select works
   - ✅ Export PNG/JSON works
   - ✅ Auto-save to browser LocalStorage works

---

## 🔧 Troubleshooting

### Page shows 404
- Wait 2-5 minutes after enabling Pages
- Check Settings > Pages shows green checkmark
- Verify branch is "main" and folder is "/ (root)"

### Page is blank
- Open browser console (F12)
- Check for errors
- Verify all files were pushed: `git status`

### Features don't work
- Check browser console for errors
- Verify interact.js CDN loaded (needs internet)
- Clear browser cache and reload

---

## 📱 Custom Domain (Optional)

If you have a custom domain:

1. Settings > Pages > Custom domain
2. Enter your domain: `workflow.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   CNAME workflow YOUR_USERNAME.github.io
   ```
4. Enable "Enforce HTTPS"

---

## 🔄 Update Deployed Site

After making changes locally:

```bash
# Stage changes
git add .

# Commit with message
git commit -m "Add new features"

# Push to GitHub
git push

# Wait 1-2 minutes, changes are live!
```

---

## 📊 GitHub Pages Features

✅ **Free hosting** (for public repos)
✅ **HTTPS automatically** (secure)
✅ **CDN globally** (fast worldwide)
✅ **No backend needed** (static files only)
✅ **Unlimited bandwidth** (reasonable use)

---

## 🎯 Best Practices

### 1. Use Relative Paths
Already done in your app:
```html
✅ <link rel="stylesheet" href="./css/styles.css">
❌ <link rel="stylesheet" href="/css/styles.css">
```

### 2. External Libraries via CDN
Already done:
```html
✅ <script src="https://cdn.jsdelivr.net/npm/interactjs@1.10.19/dist/interact.min.js"></script>
```

### 3. Test Locally First
Always test with local server before pushing:
```bash
python -m http.server 8000
# Test at http://localhost:8000
```

---

## 🔐 Security Notes

### Safe for GitHub Pages:
✅ No backend server code
✅ No database credentials
✅ No API keys (client-side only)
✅ LocalStorage is per-user, per-browser

### Keep Private:
- Don't commit `.env` files (not needed for this app)
- Don't commit sensitive data

---

## 📝 Example URLs

After deployment, your app will be accessible at:

```
Main app:
https://yourusername.github.io/ProcessFlowDesigner/

Direct to index:
https://yourusername.github.io/ProcessFlowDesigner/index.html

Debug page:
https://yourusername.github.io/ProcessFlowDesigner/debug-connections.html

Sample workflow:
https://yourusername.github.io/ProcessFlowDesigner/assets/templates/sample-workflow.json
```

---

## 🌟 Share Your App

Once deployed, share the link:
- ✅ Email to colleagues
- ✅ Add to resume/portfolio
- ✅ Share on LinkedIn
- ✅ Use in presentations
- ✅ Embed in documentation

---

## 🎓 Alternative Hosting Options

If you prefer other platforms:

### Netlify (Alternative)
```bash
# Drag and drop your folder to netlify.com
# Or use Netlify CLI
```

### Vercel (Alternative)
```bash
# Connect GitHub repo to vercel.com
# Automatic deployments on push
```

### Cloudflare Pages (Alternative)
```bash
# Connect GitHub repo to pages.cloudflare.com
# Global CDN included
```

**But GitHub Pages is the easiest and most popular!**

---

## ✅ Deployment Checklist

Before deploying:

- [ ] All files committed to git
- [ ] Tested locally with `python -m http.server 8000`
- [ ] All features working (undo/redo, multi-select, etc.)
- [ ] No console errors in browser
- [ ] Screenshots/documentation ready

After deploying:

- [ ] Visit live URL
- [ ] Test all features on live site
- [ ] Test on mobile browser
- [ ] Share link with friends/colleagues
- [ ] Add README.md with live demo link

---

## 📸 Add a README

Create a nice README for GitHub visitors:

```markdown
# Process Flow Designer

🎨 A powerful, fully client-side visual workflow designer

🔗 **Live Demo:** https://YOUR_USERNAME.github.io/ProcessFlowDesigner/

## Features
- Drag & drop node creation
- Connection tool for linking nodes
- Undo/Redo functionality
- Multi-select (Shift+Click)
- Export to PNG/JSON/SVG
- Auto-save to browser
- No backend required!

## Usage
Visit the live demo and start creating workflows immediately!
```

---

**🎉 Your app is now production-ready and can be deployed to GitHub Pages without any issues!**

The web server requirement only affects local development, not deployment.
