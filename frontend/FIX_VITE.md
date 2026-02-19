# Fix Vite Module Resolution Error

## Problem
Vite is missing module files: `Cannot find module 'D:\tri\frontend\node_modules\vite\dist\node\chunks\dep-D-7KCb9p.js'`

## Solution Steps

### 1. Stop All Running Processes
- Stop any running Vite dev server (press `Ctrl+C` in terminal)
- Close VS Code/Cursor or any IDE with the project open
- Close any Node.js processes in Task Manager if needed

### 2. Clean and Reinstall

**Option A: Quick Fix (Recommended)**
```powershell
cd D:\tri\frontend
npm cache clean --force
npm install
```

**Option B: Complete Clean (if Option A doesn't work)**
```powershell
cd D:\tri\frontend
# Stop all Node processes first, then:
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install
```

### 3. If Files Are Still Locked

If you still get "Access Denied" errors:

1. Open Task Manager (Ctrl+Shift+Esc)
2. End all Node.js processes
3. End any processes named "esbuild.exe" or "rollup"
4. Try the cleanup again

### 4. Alternative: Use Yarn (if npm continues to fail)
```powershell
cd D:\tri\frontend
npm install -g yarn
yarn install
```

## Root Cause
This usually happens when:
- Vite dev server was forcefully terminated
- Dependencies were partially installed
- File system locks from antivirus or other processes

## Prevention
- Always stop dev servers gracefully (Ctrl+C)
- Don't force-kill Node processes unless necessary
- Keep antivirus exclusions for `node_modules` if possible
