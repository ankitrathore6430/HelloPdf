# Hello PDF Suite 📄⚡

> 108+ Free, 100% In-Browser & Private PDF Tools (All Pro Features Free Forever).

Hello PDF runs entirely inside the user's browser using WebAssembly and client-side JavaScript (`pdf-lib`, `jszip`). Zero files are uploaded to any server, guaranteeing absolute data privacy and security.

---

## 🚀 Quick Deployment to Render (Static Site)

This project is fully configured for **Render Static Site**:

### Method 1: Automatic Blueprint (Recommended)
1. Push this repository to your GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` and configure everything. Click **Apply**.

### Method 2: Manual Setup
1. In [Render Dashboard](https://dashboard.render.com/), click **New +** > **Static Site**.
2. Connect your GitHub repository.
3. Use the following settings:
   - **Name**: `hello-pdf` (or any name)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**:
   - Add a rewrite rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

## 💻 Local Development

1. Clone repository:
   ```bash
   git clone <your-github-repo-url>
   cd <repo-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start local development server:
   ```bash
   npm run dev
   ```

4. Build production bundle:
   ```bash
   npm run build
   ```

5. Preview production build locally:
   ```bash
   npm run preview
   ```

---

## 📁 Project Architecture & Clean Git Files
- `src/` — React 19 + Tailwind CSS + Lucide Icons application source
- `src/services/pdfEngine.ts` — 100% client-side PDF manipulation engine (`pdf-lib`)
- `src/data/toolsData.ts` — Full catalog of 108 PDF tools
- `public/` — Static assets and `_redirects` file for SPA routing
- `render.yaml` — Ready-to-deploy Render Infrastructure as Code configuration
- `.gitignore` — Ignores `node_modules`, `dist`, local environment files, logs, and caches
