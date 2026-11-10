# 🚀 HOW TO START THE SERVER

## Step 1: Copy Images
Run this from project root:
```powershell
.\copy-images.bat
```

## Step 2: Start Dev Server
In the `frontend` folder, run:
```powershell
npm run dev
```

## Step 3: Open Browser
Go to: **http://localhost:5173**

## ⚠️ IMPORTANT
- The server runs on **port 5173** (not 3000)
- Keep the terminal open while the server is running
- You should see: `Local: http://localhost:5173/`

## 🐛 If It Fails
1. Make sure you're in the `frontend` folder
2. Run `npm install` first
3. Check for error messages in terminal
4. Try: `npm run dev -- --port 3000` (then use port 3000)

