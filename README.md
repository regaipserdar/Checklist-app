# Security Checklist Flow Dashboard

## Overview

An interactive web application for creating, managing, and sharing security testing workflows and checklists. Built with React and React Flow, it enables security professionals to create visual flowcharts of testing procedures, manage checklist items, and collaborate on security assessments.

## Features

### Core Functionality
- Interactive flow editor for creating security test workflows
- Drag-and-drop interface for building checklists
- Custom node types for different security testing phases
- Real-time collaboration and sharing capabilities
- Dark/light theme support

### Flow Management
- Create and manage multiple security test flows
- System-defined template flows
- User-created custom flows
- Sticky notes for additional documentation
- Node categorization (start, process, end nodes)

### User Interface
- Responsive layout with collapsible sidebar
- Search functionality for flows and nodes
- Detailed node editing with descriptions and tools
- Interactive controls for flow manipulation
- Modern UI with Tailwind CSS and shadcn/ui components

## Project Structure

```
src/
├── assets/
│   └── react.svg
├── components/
│   ├── CustomNode.tsx
│   ├── Footer/
│   ├── Header/
│   │   ├── Header.tsx
│   │   └── UserProfile.tsx
│   ├── Layout/
│   ├── NewFlowModal.tsx
│   ├── ProtectedRoute.tsx
│   ├── Sidebar/
│   └── ui/
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── button.tsx
│       └── ... (other UI components)
├── context/
│   └── AuthContext.tsx
├── hooks/
│   └── use-toast.ts
├── lib/
│   └── utils.ts
├── pages/
│   ├── Dashboard/
│   ├── Flow/
│   │   ├── FlowCanvas.tsx
│   │   ├── FlowDialog.tsx
│   │   ├── FlowHeader.tsx
│   │   ├── NodeDrawer.tsx
│   │   ├── useFlowActions.ts
│   │   ├── useFlowEffects.ts
│   │   └── useFlowState.ts
│   ├── Login/
│   ├── NotFoundPage.tsx
│   └── Profile/
├── services/
│   ├── Authservice.tsx
│   ├── CacheService.tsx
│   ├── DefaultNodesService.tsx
│   ├── FlowContexts.tsx
│   ├── Pb-getFlowService.tsx
│   ├── SaveService.ts
│   ├── SystemFlow-Nodes.tsx
│   ├── UserFlowService.tsx
│   └── apiService.tsx
└── routes.tsx
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd security-checklist-flow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Required Dependencies

```bash
# Core dependencies
npm install react react-dom react-router-dom reactflow @radix-ui/react-dropdown-menu @radix-ui/react-dialog

# UI and styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Additional utilities
npm install next-themes react-helmet-async
```

## Environment Configuration

```bash
# .env
VITE_APP_API_URL=http://localhost:8090
VITE_APP_VERSION=1.0.0
```

## Development Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "serve": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Project Maintainer - [@regaipserdar](https://github.com/regaipserdar)

Project Link: [https://github.com/regaipserdar/security-checklist-flow](https://github.com/regaipserdar/security-checklist-flow)