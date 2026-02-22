# Olive AI

Olive AI is a comprehensive health and medication management platform designed to provide intelligent, accessible, and reliable healthcare assistance. Built with a focus on maternal wellness, medication safety, and prescription management, Olive AI serves as a digital health companion.

## Overview

Olive AI leverages modern web technologies and artificial intelligence to offer a suite of tools that help users manage their health effectively. The platform is built with Next.js and features a responsive, accessible, and offline-capable architecture.

### Key Features

*   **Medication Safety:** Intelligent drug interaction checking and safety profiling.
*   **Prescription Scanning:** OCR-powered prescription reading and digitization.
*   **Maternal Wellness:** Specialized tracking and guidance for pregnancy and maternal health.
*   **Smart Reminders:** Automated medication and appointment scheduling.
*   **Offline Support:** Core functionalities remain accessible even without an internet connection.
*   **Voice Interface:** Voice-activated commands for hands-free interaction.

## Architecture

The application is built using a modern React stack:

*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS
*   **Typography:** Inter (Body) & Plus Jakarta Sans (Headings)
*   **State Management:** React Hooks
*   **PWA:** Service Workers for offline capabilities
*   **Backend:** Render hosted API (https://olive-backend-bly2.onrender.com)

### API Integration

Complete backend API integration with 8 modules covering 49 endpoints:
- **Users**: Authentication, registration, email/phone verification
- **Prescriptions**: Create, upload, retrieve prescriptions with image processing
- **Medications**: Track medications with intake logging
- **Reminders**: Schedule and manage medication reminders
- **Drugs**: Search drug database with side effects and interactions
- **Doctors**: Find and consult healthcare professionals
- **Voice**: Audio transcription and speech synthesis
- **Health**: System health monitoring

### Directory Structure

```text
Olive-AI/
├── app/                # Next.js App Router pages and layouts
├── components/         # Reusable UI components
│   ├── layout/         # Structural components (Navbar, Sidebar, etc.)
│   └── ui/             # Interactive elements (Buttons, Cards, Overlays)
├── hooks/              # Custom React hooks (useAuth, useOffline, etc.)
├── services/           # External API integrations (Gemini, OCR, NAFDAC)
├── lib/                # Core utilities and API client
├── constants/          # Application constants and configuration
└── public/             # Static assets and PWA manifest
```

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Astronomox/Olive-AI.git
    ```

2.  Navigate to the project directory:
    ```bash
    cd Olive-AI
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

4.  Set up environment variables:
    Create a `.env.development` file in the root directory and configure the necessary API keys and backend URLs.

5.  Start the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## Development Guidelines

*   **Accessibility:** Ensure all new components adhere to WCAG guidelines. Use semantic HTML and ARIA attributes where necessary.
*   **Styling:** Utilize Tailwind CSS utility classes. Follow the design tokens defined in `tailwind.config.ts` and `app/globals.css`.
*   **State:** Prefer local component state or custom hooks over global state management unless absolutely necessary.
*   **API Calls:** Use the centralized API client located in `lib/api.ts` for all backend communication to ensure consistent error handling and authentication.

## Testing

Verify all API endpoints are working:
```bash
node scripts/verify-api-endpoints.js
```

Run the test suite:
```bash
npm test
```

## Deployment

### Vercel Deployment

```bash
npm run build
vercel deploy --prod
```

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_BACKEND_URL`: Backend API base URL
- `NEXT_PUBLIC_ENABLE_VOICE`: Enable voice features
- `NEXT_PUBLIC_ENABLE_OFFLINE_MODE`: Enable offline support
- `NEXT_PUBLIC_ENABLE_EMERGENCY_SOS`: Enable emergency features

## API Documentation

See `API_DOCUMENTATION.md` for complete endpoint specifications, request/response examples, and usage patterns.

## License

This project is proprietary and confidential.
