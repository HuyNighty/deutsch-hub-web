# DeutschHub Web

DeutschHub Web is the frontend application of the DeutschHub platform.

Built with **React 19** and **Vite**, the application provides the user-facing experience for learning German and interacting with the DeutschHub platform.

The frontend follows a **feature-based architecture**, with shared application infrastructure separated from business features, pages, layouts, and reusable UI components.

---

# Vision

DeutschHub aims to become more than a traditional language learning website.

The platform is being developed around multiple user needs, including:

* Learning German
* Exploring Germany
* Studying in Germany
* Reading and exploring experiences
* Managing a personal learning journey

The frontend provides the user-facing layer through which these experiences are delivered.

---

# Core Concepts

The frontend is organized around:

* User-Centered Design
* User Journey
* Information Architecture
* Feature-Based Architecture
* Reusable Components
* Separation of shared infrastructure and business features
* Responsive user experience

These principles guide the organization of the frontend as the product evolves.

---

# Tech Stack

| Technology   | Purpose                                    |
| ------------ | ------------------------------------------ |
| React 19     | Frontend library                           |
| Vite         | Development and build tool                 |
| JavaScript   | Programming language                       |
| React Router | Client-side routing                        |
| Axios        | HTTP client                                |
| JWT          | Authentication state and API authorization |
| CSS          | Application styling                        |

The exact dependencies and versions are defined in `package.json`.

---

# Current Product Areas

The current frontend source is organized around business-oriented features.

Current feature areas include:

```text
src/features/
├── auth/
├── account/
├── content/
├── learn-german/
├── lesson/
├── media/
├── my-learning/
└── my-course-detail/
```

These features support the current product experience across authentication, account management, learning, content, and media-related flows.

The feature structure is expected to evolve as the product and backend domains evolve.

---

# Authentication

Authentication is implemented through the frontend authentication infrastructure.

The current application:

* stores access and refresh tokens locally;
* attaches authentication credentials to API requests;
* handles access-token refresh;
* redirects users according to protected and public routes.

Relevant source:

```text
src/shared/auth/
src/shared/api/axios.js
src/app/router/routes.jsx
```

The frontend communicates with the backend Identity APIs for authentication and account-related operations.

---

# Learning Experience

The current frontend includes a course-based learning experience.

Current learning-related features include:

* Published course browsing
* Course detail
* Course enrollment
* My learning
* Enrolled course detail
* Lesson detail
* Lesson navigation
* Lesson completion
* Learning progress
* Completed lessons
* Lesson media access

Relevant source:

```text
src/features/learn-german/
src/features/lesson/
src/features/my-learning/
src/features/my-course-detail/
src/features/media/
```

The frontend currently reflects the backend's course-centered Learning implementation.

The Learning Context itself is being reassessed in the backend as part of **V3 — Learning Context**. The frontend therefore should not be interpreted as defining the final Learning domain model.

---

# Content

The frontend contains a Content feature:

```text
src/features/content/
```

This feature supports the current user-facing Content experience provided by the backend.

The Content area is maintained separately from the current course-based learning features.

---

# Application Structure

The frontend source is organized as:

```text
src/
│
├── app/          # Application bootstrap and routing
├── assets/       # Static assets
├── features/     # Business-oriented features
├── layouts/      # Application layouts
├── mocks/        # Mock data and development support
├── pages/        # Page-level composition
└── shared/       # Shared API, authentication, UI, and utilities
```

The exact responsibilities of individual directories should be determined from their current implementation rather than from this README alone.

---

# Architecture

The frontend follows a feature-based organization.

A simplified dependency relationship is:

```text
Pages / Routes
      ↓
Features
      ↓
Shared UI / Utilities / API
      ↓
Backend APIs
```

Business functionality is grouped under `src/features/`, while reusable infrastructure and cross-feature concerns are placed under `src/shared/`.

Application-level routing and bootstrap logic are located under:

```text
src/app/
```

---

# API Integration

The frontend communicates with the DeutschHub backend through Axios.

The API clients are defined in:

```text
src/shared/api/axios.js
```

The current implementation provides separate API clients for the backend API namespaces used by the application.

Authentication-related request and token handling is integrated with the Axios request/response flow.

---

# Routing

Application routing is defined under:

```text
src/app/router/routes.jsx
```

The current route structure distinguishes between:

* Public routes
* Guest-only routes
* Protected routes

This allows authentication state to control access to user-specific application areas.

---

# Backend

DeutschHub Web communicates with the DeutschHub Backend.

The backend is built with:

* Java 21
* Spring Boot
* Domain-Driven Design (DDD)
* Hexagonal Architecture
* Modular Monolith architecture

The frontend and backend are maintained as separate projects.

---

# Current Development Direction

The frontend is evolving alongside the backend domain model.

The current development focus includes:

* Product experience
* User journeys
* Feature development
* UI implementation
* Backend API integration
* Authentication and protected application flows
* Learning experience

As backend domains evolve, frontend features may also be reorganized to reflect clearer business responsibilities.

---

# Future Development

Potential areas for future development include:

* Expanded learning experiences beyond the current course flow
* Additional Content experiences
* Responsive improvements
* Accessibility
* Internationalization
* Dark mode
* Progressive Web App capabilities
* AI-assisted learning experiences

These items represent possible future directions rather than currently implemented capabilities.

---

# License

This project is developed for learning purposes and personal portfolio use.
