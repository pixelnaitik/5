# Healthcare OS Design System (UI/UX)

This document details the visual and experiential design system of Healthcare OS. It outlines the core aesthetics, typography, color palette, navigation logic, and accessibility guidelines to help you accurately replicate or extend the project.

## 1. Aesthetic Overview & Tone

Healthcare OS is designed with a **"Clinical Modern"** aesthetic. The goal is to convey trust, high precision, cleanliness, and speed. It avoids loud, distracting colors prioritizing a surgical, organized look using deep blues, crisp whites, and controlled accent colors.

*   **Tone:** Professional, Secure, Technical, and Clean.
*   **Methodology:** Tailwind CSS (v4) Mobile-first functional utility classes integrated deeply with custom semantic color variables.

## 2. Typography

The application uses a single primary font family to maintain a robust and highly legible technical appearance.

*   **Primary Font:** **Inter** (Google Fonts). It acts as both the sans-serif standard and display font.
*   **Weights:** 
    *   `Regular (400)`: Used for standard paragraph text and small labels.
    *   `Medium (500)`: Used for inputs and secondary buttons.
    *   `Semibold (600)` & `Bold (700)`: Used for primary buttons, data table headers, and structural subheadings.
    *   `Black (900)`: Used exclusively for large marketing headings and bold dashboard stats to create high stark contrast.

_Configuration:_ Mapped to `--font-sans` and `--font-display` in the CSS entry point.

## 3. Semantic Color Palette

We utilize a heavily semantic, Material-inspired variable system instead of hardcoded hex values, ensuring easy dark-mode transition support in the future and unified branding.

**Brand & Primary Data:**
*   `--color-primary (#00263f)`: Deep Navy. Used for text headings, active states, and primary heavy branding.
*   `--color-primary-container (#0b3c5d)`: Muted Navy. Used for structural blocks, selected navigational elements, and hover states.

**Accents & Secondary:**
*   `--color-secondary (#006a66)`: Teal/Medical Green. Used for success states, verifications, and safe actions.
*   `--color-secondary-container (#84f2eb)`: Light Teal. Backgrounds for success banners and secure alerts.

**Surface & Backgrounds (The Canvas):**
*   `--color-background (#f7f9fc)`: Very light gray/blue. The absolute background of the app.
*   `--color-surface (#f7f9fc)`: Standard card backgrounds (often overridden with white for contrast).
*   `--color-surface-container (#eceef1)`: Slightly darker gray for input backgrounds and distinct segregated sections.
*   `--color-on-surface-variant (#42474e)`: Muted text for descriptions, form hints, and secondary inactive data.

**Borders:**
*   `--color-outline-variant (#c2c7ce)`: Subtle dividers and inactive input borders.

## 4. Layout, Spacing & Shapes

**Structure:**
*   **Navigation:** Left-aligned fixed Sidebar (`src/components/Sidebar.tsx`) on desktop, gracefully collapsing into a hamburger menu or bottom bar on mobile.
*   **Content Canvas:** The main content area expands to fill the remaining viewport. We use `max-w-7xl` on internal container boundaries so wide monitors don't stretch forms excessively.
*   **Radii (Border Radius):** The design favors friendly but structural rounded corners.
    *   Standard Cards: `var(--radius-3xl)` or `2xl` to create pill-like or soft-block layouts.
    *   Inputs/Buttons: `var(--radius-xl)` for comfortable tap targets.

**Glassmorphism:**
*   A custom `.glass-card` CSS utility class applies a dense blur `backdrop-filter: blur(20px)` bound with `rgba(255, 255, 255, 0.7)` background. This is used in floating headers and certain dashboard widgets to provide depth without losing structural integrity.

## 5. UI Components & UX Engineering

**High-Speed Data Entry:**
A critical UX feature in the `ReportsPage.tsx` allows pathologists to keep their hands on the keyboard. 
*   **Keyboard Navigation (A11y & UX):** The inputs listen to `onKeyDown` events. Pressing `Enter`, `ArrowDown`, or `ArrowUp` automatically shifts the DOM focus to the next/previous test result input field. This prevents endless clicking.
*   **Real-time Validation:** Result inputs dynamically bold and flag themselves (using Arrow indicators in the PDF, and visual cues in the UI) if they surpass biological reference ranges.

**Feedback & Indication:**
*   **Loaders:** `lucide-react` spinners replace static text when waiting for Firebase promises.
*   **Empty States:** Empty table states feature subtle, low-opacity illustrations and clear "Create New" Call-To-Actions (CTAs).

## 6. Accessibility (A11y)

*   **Focus States:** All interactive elements use `focus:ring-2 focus:ring-primary-container outline-none`. This removes the default browser blue border and replaces it with an intentional, theme-oriented focus ring.
*   **Contrast:** The specific hex choice (`#00263f` Navy on `#ffffff` White) well exceeds the WCAG AAA contrast ratio standards for text readability.
*   **Semantic HTML:** Utilization of proper semantic tags (`<nav>`, `<header>`, `<main>`, `<section>`).

## 7. Animation & Motion Design

We utilize `framer-motion` to construct the interaction feel.
*   **Page Transitions:** Soft opacity fade-ins and subtle Y-axis translations (`y: 20` to `y: 0`) when changing routes to eliminate jagged painting.
*   **Staggered Lists:** Tables and lists (like patient names) load their children chronologically with staggered delays to guide the eye downward.
*   **Micro-interactions:** Buttons scale down (`whileTap={{ scale: 0.98 }}`) providing tactile feedback confirming clicks before network requests complete.

## 8. PDF Export Design System

The clinical report generated by `jspdf` follows its own strict printable design system:
*   **Typography:** Defaults to absolute standard `helvetica` to ensure font compatibility across all devices and printers. 
*   **Size:** Standard A4 (210x297mm).
*   **Color Profile:** Strict Grayscale and profound Black (`textColor: 0`) for the actual test results to save printer ink and increase contrast. Headers use a muted dark blue `[11, 60, 93]` for brand consistency if printed in color.
*   **Information Hierarchy:** Patient metadata permanently anchors the top of every printed page. Tests are tightly grouped using `isGroup` structural arrays mimicking the structure on the screen directly to paper.
