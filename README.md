# Healthcare OS

**Healthcare OS** is a secure, smart digital pathology laboratory management system built with React, Vite, Tailwind CSS, Express, and Firebase. It provides comprehensive tools for patient registration, report generation (with PDF export), AI-assisted screening, billing, and report verification.

---

## 📖 Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Local Development Setup](#local-development-setup)
4. [System Architecture Overview](#system-architecture-overview)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Cloudflare Deployment Guides](#cloudflare-deployment-guides)
7. [Cross-Platform Native Porting (Android & Windows)](#cross-platform-native-porting-android--windows)

---

## Features

- **Dashboard:** An overview of key laboratory metrics including revenue, total tests, new patients, and pending reports.
- **Patient & Doctor Management:** Register patients, search records, and manage doctor registers. Fully tracks test prescriptions and connects records together.
- **Multi-Range Calendar System:** Features a state-of-the-art interactive date selection panel built directly into the patients and doctors lists. Supports preset ranges (Today, 7 Days, 30 Days, This Month), fully custom from-to ranges, custom month switching, and intuitive bottom dot markers highlighting which dates contain database records.
- **Report Generation:** Create accurate pathology reports for various tests (e.g., CBC, Liver Function, Lipid Profile). Real-time test result data entry with embedded JS-PDF report generation. Keyboard navigation (using Enter or Arrow keys) is enabled for high-speed value entries.
- **Dynamic Themes:** Personalized custom theme color system dynamically loaded directly from laboratory configurations (stored in LocalStorage and configured in the Settings Panel). Features five highly polished, healthcare-optimized palettes with zero layout flash on page loading: *Classic Navy*, *Clinical Teal*, *Royal Amethyst*, *Slate Charcoal*, and *Hematology Red*.
- **Custom Tests & Grouping:** Create new pathology tests and profiles dynamically. Pathologists can configure custom test names, categories, reference groups, measurement units, and custom male/female or adult/child reference boundaries.
- **Dynamic Report Templates:** Select between 'Modern', 'Classic', 'Minimalist', or 'Plain / Pre-printed Pad'—a specialized high-compatibility format designed for pre-printed letterheads.
- **Verification System & QR Signatures:** Real-time generation of security verification QR codes on PDF reports, directing scanning users to a secure verification sub-portal.
- **Settings:** Customize clinic operational parameters and details like names, logos, phone numbers, and address configurations dynamically.
- **Authentication:** Secure staff and pathologist dashboards utilizing Firebase Authentication rules.

---

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS 4, Framer Motion, Lucide React
- **Backend:** Node.js, Express
- **Database / Auth:** Firebase (Firestore, Authentication)
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Build Tool:** Vite, esbuild

---

## Local Development Setup

Follow these detailed instructions to duplicate the environment and run this application on your local machine.

### Prerequisites
Ensure you have the following installed on your machine:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (Version 18 or higher is recommended)
- A Code Editor like [VS Code](https://code.visualstudio.com/)
- A Google Firebase Account (for setting up your own backend instance)

### 1. Clone the Repository
Clone this repository to your local machine using git:
```bash
git clone https://github.com/your-username/healthcareos.git
cd healthcareos
```

### 2. Install Dependencies
Install all the necessary NPM packages:
```bash
npm install
```

### 3. Firebase Setup
Since this application relies strictly on Firebase for authentication and database management, you must configure a Firebase project.
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Navigate to **Firestore Database** and create a new database.
3. Once the database is created, go to the **Rules** tab. Copy the contents of the `firestore.rules` file from this project repository and paste it into the Firebase rules editor, then Publish.
4. Navigate to **Authentication** -> **Sign-in method** and enable the **Google** sign-in provider (and Email/Password if you prefer).
5. Go to **Project Settings** (the gear icon) -> **General**. Scroll down to find the "Your apps" section and click the Web template `</>` button to register a web app.
6. Copy the `firebaseConfig` object provided by Firebase.

### 4. Configuration
Create a file named `firebase-applet-config.json` in the root folder of your project (`healthcareos/firebase-applet-config.json`).
Structure it as follows with your unique variables obtained from the Firebase console:
```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id",
  "firestoreDatabaseId": "(default)"
}
```

Check the `.env.example` file and create a local `.env` file for any environment variables needed. 

### 5. Running the Application (Development)
Start the local Vite development server:
```bash
npm run dev
```
You can now open your browser and navigate to `http://localhost:3000`.

### 6. Building for Production
When you are ready to deploy or want to run the full Express integration server:
1. Build the frontend assets:
   ```bash
   npm run build
   ```
2. Start the production backend server:
   ```bash
   npm start
   ```

### 7. CI/CD & Deployment
This project includes a fully configured GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated testing and deployment for Firebase Hosting.

**To enable CI/CD:**
1. Configure Firebase Hosting by running `firebase init hosting` in the root folder, using `dist` as the public directory. A `firebase.json` is already provided.
2. Get your Firebase CI token: `firebase login:ci`
3. In your GitHub repository, go to Settings -> Secrets and Variables -> Actions and add `FIREBASE_SERVICE_ACCOUNT` with your service account credentials.

Whenever code is pushed to the `main` branch, the workflow will automatically lint, build, and deploy the application.

---

## System Architecture Overview

Healthcare OS uses a monolithic repository holding both a modern client-centric Single Page Application (SPA) built with React and Vite, alongside an Express backend component serving static files and API requests.

### 💾 Firestore Database Structure
The application communicates directly with Firebase via the client SDK. The database schema is structured as follows:
- **`users` collection:** Stores user profiles and Roles. Roles (e.g., 'admin', 'staff') dictate authorization boundaries.
- **`patients` collection:** Contains demographic data (`name`, `age`, `gender`, `contact`), timestamps, reference values, and an embedded array `testSelection` that holds selected test identifiers.
- **`reports` collection:** Houses the outcome test values matched against the selected tests. Each report connects to a patient via `patientId`. It maintains a `resultData` dictionary/map where the keys are string identifiers of tests and values are result outcomes. Also stores the `digitalSignature` if finalized.
- **`settings` collection:** Stores global customizable laboratory info (`labName`, `address`, `phone`, `email` etc.) configured in the Settings panel.

### 🔄 Patient Data Flow
1. **Registration:** A user registers a patient via the `/patients` route. Demographic data and required tests are saved in the `patients` collection.
2. **Pending Queue:** The `/reports` route fetches patients who have test selections but no corresponding document in the `reports` collection, acting as a dynamic "Awaiting Report" queue.
3. **Result Entry:** The UI maps the `testSelection` array to the internal structured data (provided by `getPathologyTests()`) to render input fields and dropdowns. Results are stored in local React state (`newReport.results`).
4. **Finalization:** The data is pushed to the `reports` collection, effectively removing the patient from the "Awaiting" queue and placing their report in the finalized list.

### 📄 Report Generation Lifecycle (`jspdf`)
The core PDF generation occurs in `src/pages/dashboard/ReportsPage.tsx` using `jsPDF`. The lifecycle is:
1. **Preparation Phase:** Data gathering takes place. The selected report (`selectedReport`), patient details (`patient`), and dynamic lab settings (`settings`) are fetched.
2. **Template Engine:** The canvas is generated based on the selected layout (`modern`, `classic`, `minimalist`, or `blank` for pre-printed pads). Shapes (`doc.rect`), custom fonts (`helvetica`), colors (`doc.setTextColor`), and branding (Logos) are rendered manually using absolute positioning (X, Y coordinates). The `blank` template intelligently omits graphical header components to avoid overlapping existing lab stationery.
3. **Data Parsing & Chunking:** Test definitions in `pathology-tests.ts` map to the `reports.resultData`. Tests that share the same `isGroup` flag (like `CBC` or `ABO`) are grouped using array chunking logic.
4. **Reference Boundaries:** Result values are checked against minimum/maximum reference ranges extracted based on patient Age and Gender criteria. If a result is out of range, suffix markers (e.g., `__UP__` or `__DOWN__`) are appended temporarily.
5. **AutoTable Execution:** `jspdf-autotable` processes the mapped array chunks. The `didParseCell` and `didDrawCell` lifecycle hooks intercept cells. It reads the suffix markers, removes them, bolds the text securely, and calculates coordinates to physically draw Up/Down arrows (`doc.triangle`, `doc.line`) in the actual PDF context.
6. **Secure Hashing & QR Code:** If security anchoring is enabled, a SHA-256 hash representing the signature string is processed or verified. A QR Code is generated linking to the `/verify` route using the report ID.
7. **Output:** `doc.save('Report.pdf')` or `doc.output('bloburl')` completes the execution for local storage or viewing.

---

## Firestore Security Rules

The Firestore rules (`firestore.rules`) act as the absolute source of truth for authorization, preventing bypassing via client-side manipulation.
- **`isValidId`**: Ensures string safety and bounds on inputs.
- **`isAdmin`**: Asserts existence of the calling User UID in an internal Admin directory.
- **`isStaff`**: Ensures basic authentication and role.
- **Data Integrity Checks**: Enforces rules so user-provided metadata strictly matches the exact scheme layout using `.affectedKeys().hasOnly()`. Required string types, size lengths, and structural mapping validations actively reject malformed injection payload requests.

---

## Cloudflare Deployment Guides

If you have a public static marketing website hosted on Cloudflare (e.g., Cloudflare Pages), you can integrate this dashboard using one of the three configurations:

### Option A: Subdomain Routing (Recommended)
Host the dashboard at `https://dashboard.yourclinic.com` while your landing page remains at `https://yourclinic.com`.
1. Build the SPA assets locally: `npm run build` (outputs to the `dist/` directory).
2. Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **Create an Application** -> **Pages**. Upload the `dist/` folder.
3. In custom domains, add `dashboard.yourclinic.com`.

### Option B: Cloudflare Workers Reverse Proxy (Sub-path Integration)
Host the dashboard on a subpath (e.g., `https://yourclinic.com/dashboard`) using a Cloudflare Worker proxy to routing:
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/dashboard') {
      return Response.redirect(`${url.origin}/dashboard/`, 301);
    }
    const targetPath = url.pathname.replace(/^\/dashboard/, '');
    const upstreamUrl = `https://my-dashboard-app.pages.dev${targetPath}${url.search}`;
    const modifiedRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    return fetch(modifiedRequest);
  }
};
```

### Option C: Embedded iFrame
Embed the dashboard on a designated page inside an `<iframe>`:
```html
<iframe 
  src="https://dashboard.yourclinic.com/login" 
  id="lab-dashboard-frame"
  style="width: 100%; height: 100vh; border: none;"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
  allow="camera; microphone; geolocation"
></iframe>
```
*Note on iFrames:* Standard Google Popup login (`signInWithPopup`) might be blocked due to third-party cookie restrictions. Set up auth redirects or ensure the host and iframe use matching top-level domains.

---

## Cross-Platform Native Porting (Android & Windows)

If you plan to convert Healthcare OS into a mobile app (Android `.apk`/`.aab`) or a desktop app (Windows `.exe`), you can reuse approximately **90% of the UI and code** using wrappers.

### 🚨 Core Architectural Requirement
The app currently relies on a local Node.js server (`server.ts`). **For Android (which cannot run local Node servers), the Express server backend must be decoupled and hosted remotely (e.g., on Google Cloud Run) to act as a public API endpoint.**

### 📱 1. Converting to Android (Capacitor)
[Capacitor](https://capacitorjs.com/) wraps your React build into a native Android WebView:
- **Process**:
  1. Build the web app: `npm run build`.
  2. Install Capacitor packages: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`.
  3. Initialize and sync: `npx cap init` and `npx cap add android`.
  4. Open in Android Studio to build the APK/AAB.
- **Android Challenges**:
  - **Firebase Auth**: Popups (`signInWithPopup`) fail in WebViews. Use `@capacitor-firebase/authentication` for native Google login.
  - **PDF Saving**: Browsers use `<a download>` which fails in WebViews. Use `@capacitor/filesystem` and `@capacitor/share` to save and open files.

### 💻 2. Converting to Windows (Electron / Tauri)
Use [Electron](https://www.electronjs.org/) or [Tauri](https://tauri.app/) to package the React bundle:
- **Process**:
  1. Add Electron/Tauri developer dependencies.
  2. Create a main script initialization (e.g., `main.js`) that wraps the output HTML in a desktop viewport.
  3. Package the executable using `electron-builder`.
- **Windows Challenges**:
  - **Authentication**: Set up deep-linking or custom URL protocols to return authorization tokens from external browsers.
  - **Security**: Tighten Inter-Process Communication (IPC) boundaries since desktop apps have full filesystem access compared to browser sandboxes.
