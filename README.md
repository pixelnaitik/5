# Healthcare OS

**Healthcare OS** is a secure, smart digital pathology laboratory management system built with React, Vite, Tailwind CSS, Express, and Firebase. It provides comprehensive tools for patient registration, report generation (with PDF export), AI-assisted screening, billing, and report verification.

## Architecture & Technical Details

For an in-depth understanding of the system's architecture, report generation lifecycle, Firebase logic, and data structuring, please refer to the detailed [Technical Details Document (technical_details.md)](technical_details.md) included in this repository. 
If you are planning to port the application to Android native or Windows (.exe), please read the [Conversion Report (CONVERSION_REPORT.md)](CONVERSION_REPORT.md).

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

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS 4, Framer Motion, Lucide React
- **Backend:** Node.js, Express
- **Database / Auth:** Firebase (Firestore, Authentication)
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Build Tool:** Vite, esbuild

## How to Duplicate / Setup Locally (Step-by-Step)

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

You can now open your browser and navigate to `http://localhost:3000`. You should be greeted by the Healthcare OS starting page and login screen.

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

## Security & Database Rules
Refer to `firestore.rules` for the implemented Firestore security boundaries. It handles row-level and collection-level security. The rules strictly isolate Admin, Staff, and global users while performing input validation on document schemas directly on the backend to prevent malicious edits.

---

## ☁️ Integrating the Dashboard into a Cloudflare Static Website

If you have a public static marketing or clinic website already deployed and hosted on **Cloudflare** (e.g., Cloudflare Pages or Cloudflare Workers), you can seamlessly integrate this companion pathology dashboard. Here are the three industry-standard architectural configurations to link them together:

### Option A: Subdomain Routing (Highly Recommended)
This is the cleanest, most performant, and standard SaaS architecture. Your landing page remains at `https://yourclinic.com` while staff / pathology operations run at `https://dashboard.yourclinic.com`.

**Step-by-step Setup on Cloudflare:**
1. **Build the SPA Assets:** Generate the standalone production build locally or in your CI pipeline:
   ```bash
   npm run build
   ```
   This generates the optimized static files in the `dist/` directory. (Note: Since the app's database logic communicates directly from the client browser to Firestore and Firebase Auth, the frontend can run completely serverless/stateless as an SPA, bypassing the standalone Node server).
2. **Deploy to Cloudflare Pages:**
   - Go to your **Cloudflare Dashboard** -> **Workers & Pages** -> **Create an Application** -> select **Pages**.
   - Connect your GitHub repository or upload the `dist/` folder manually.
   - For framework settings, choose **Vite** or **No Framework**, set the build command to `npm run build`, and the output directory as `dist`.
3. **Configure Custom Subdomain:**
   - In your Cloudflare Pages project settings, go to the **Custom Domains** tab.
   - Add your desired subdomain (e.g., `dashboard.yourclinic.com`).
   - Cloudflare will automatically configure the DNS records and issue an SSL certificate.
4. **Link from your main Website:**
   - Simply add a high-contrast action button (e.g., "Pathologist Login" or "Lab Portal") on your static landing page header that href links directly to `https://dashboard.yourclinic.com`.

---

### Option B: Cloudflare Workers Reverse Proxy (Sub-path Integration)
If you want the dashboard to live on a subfolder of your main domain (e.g., `https://yourclinic.com/dashboard`), you can use a lightweight **Cloudflare Worker** as a reverse proxy. This avoids any cross-origin (CORS) complexity and keeps SEO unified.

**Worker Script Configuration:**
1. Host your built Dashboard on Cloudflare Pages or Cloud Run (e.g. `https://my-dashboard-app.pages.dev`).
2. Deploy a lightweight Cloudflare Worker matching your main domain route: `https://yourclinic.com/dashboard*`
3. Write the following Worker handler to proxy the requests transparently:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Redirect /dashboard (without trailing slash) to /dashboard/ to align relative asset paths
    if (url.pathname === '/dashboard') {
      return Response.redirect(`${url.origin}/dashboard/`, 301);
    }
    
    // Rewrite path to target the deployed dashboard instance
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

---

### Option C: Seamless Embedded iFrame
If you want to keep users entirely on your static website templates, you can embed the dashboard on a designated page (e.g., `https://yourclinic.com/portal.html`) inside an `<iframe>`.

**Implementation Guidelines:**
```html
<iframe 
  src="https://dashboard.yourclinic.com/login" 
  id="lab-dashboard-frame"
  style="width: 100%; height: 100vh; border: none;"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
  allow="camera; microphone; geolocation"
></iframe>
```

**⚠️ Essential Considerations for iFrame Embedding:**
1. **Firebase Authentication Popups:** Browser cookie sandboxes often block standard Google Popup login (`signInWithPopup`) inside an `<iframe>` under a different domain name due to **Third-Party Cookie Policies**.
   - *Fix:* Ensure authentication is set to use page redirects instead of popup overlays inside third-party viewports, or maps both the host and frame to matching top-level domain addresses (e.g. `yourclinic.com` and `portal.yourclinic.com`).
2. **Frame Permissions:** If your pathologists use physical cameras or scanners to capture barcodes or patient documents, make sure the `allow` permission attributes (e.g., `camera`) are explicitly defined on the DOM `<iframe>` element.

