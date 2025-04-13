# Project Requirements Document (PRD) for Aaron's Personal Living

## 1. Project Overview

Aaron's Personal Living is a Personal Life Management SaaS designed as a web application that brings premium UI aesthetics together with practical tools for daily personal management. The idea is to offer an intuitive, elegant interface that acts like a personal assistant helping professionals, students, and individuals organize their tasks, habits, projects, and financial and personal growth activities. The platform integrates features like task management, habit tracking, project planning, goal setting, and financial management into one cohesive tool, making it easier to manage everyday priorities and long-term aspirations.

This project is being built to improve productivity and user satisfaction by providing a comprehensive and beautifully designed personal management platform. Success for the project is measured by smooth user engagement, an intuitive user experience, the reliability of the integrated AI assistant (powered by GPT-4o), and the scalability of the system to support a growing number of users with responsive design across multiple devices.

## 2. In-Scope vs. Out-of-Scope

### In-Scope

*   **Dashboard (Aaron's Personal Living)**: The centerpiece accessible after authentication with an integrated overview of tasks, habits, projects, goals, and financial insights.
*   **Task Management**: Creating, editing, deleting, and categorizing tasks by Today, Tomorrow, or specific dates.
*   **Habits Table**: Creating, managing, and tracking daily or weekly habits with reminders and progress tracking.
*   **Projects Section**: Tools for creating and planning projects including deadlines, sub-tasks, and milestones.
*   **Goals Section**: Setting up, tracking, and managing both personal and professional goals.
*   **Financial Management Tools**: Subscription tracking, budgeting, expense monitoring, and integration with external financial APIs.
*   **Journaling and Notes Sections**: Daily journaling for reflections and a notebook organizer for various note categories.
*   **Personal AI Assistant**: Integration with GPT-4o offering conversational assistance, maintaining context for up to 30 past interactions, and providing web search capabilities with a daily cap.
*   **Third-Party Integrations**: Integration with services such as Google Calendar for scheduling and Plaid for real-time financial insights.
*   **Account Settings & Data Privacy Options**: Options for data export, account deletion, two-factor authentication, and adherence to privacy policies.

### Out-of-Scope

*   **Multi-User Roles or Admin Privileges**: The application is designed for a singular user experience with no complex role-based access.
*   **Advanced Customization Beyond Premium Scope**: While the free tier offers basic functionality, advanced custom features and extensive UI personalization are reserved for later premium rollouts.
*   **Overwhelming Third-Party Integrations**: Only select external services are integrated in the initial release, with additional integrations planned for future phases.
*   **Complex Mobile App Versions**: The first version is a web application; dedicated native mobile applications will be considered in later stages.

## 3. User Flow

A new user visits the homepage and is greeted with an attractive login and registration interface where they can sign up using email or opt for a social login. Once registered, the user is taken through a brief onboarding process that highlights the key features of Aaron's Personal Living. After signing in, the user is directed to a personalized dashboard that aggregates tasks, habits, projects, goals, and quick financial insights. Clear navigation options along the left sidebar allow them to move between sections such as Task Management, Habit Tracker, Projects, Goals, Journals, and Financial Tools.

After the initial setup, users interact with the application by adding tasks, setting habits, planning projects, and entering journal entries. The dashboard provides immediate visual feedback with smooth animations and responsive updates, ensuring that any change (like marking a task as complete or updating a habit’s status) is instantly reflected. Additionally, the built-in AI assistant is accessible directly from the dashboard, ready to provide conversational support, schedule management, and even conduct web searches on user-specific queries under defined daily limits.

## 4. Core Features

*   **Dashboard Overview**: A centralized space displaying tasks, habits, projects, goals, and financial insights for easy daily management.

*   **Task Management**:

    *   Creating, editing, categorizing, and deleting tasks.
    *   Scheduling tasks for Today, Tomorrow, specific dates, or the next 7 days.
    *   Setting reminders and marking tasks as completed.

*   **Habits Table**:

    *   Create and manage daily or weekly habits.
    *   Set reminders and track habit completion through visual progress markers.

*   **Project Planning & Goal Setting**:

    *   Create projects with titles, descriptions, deadlines, and sub-tasks.
    *   Organize and track personal and professional goals, milestones, and progress.

*   **Financial Tools**:

    *   Subscription tracking for recurring expenses.
    *   Budgeting features to monitor financial in-flow and out-flow, monthly expenses, and recurring revenues.

*   **Journaling and Notes**:

    *   Daily journaling section for personal reflections.
    *   Organized note-taking via multiple notebooks with rich text formatting.

*   **Personal AI Assistant**:

    *   Conversational capabilities using GPT-4o.
    *   Retains context for up to 30 past interactions.
    *   Performs web searches with a daily cap (limit of 10 searches per user).

*   **Third-Party Integration**:

    *   Sync with Google Calendar for task appointments.
    *   Integration with financial APIs like Plaid for real-time insights.

*   **Account Settings & Data Management**:

    *   Data export capabilities in CSV or JSON.
    *   Secure account deletion and two-factor authentication (2FA).
    *   Transparent privacy policies ensuring data security and compliance.

## 5. Tech Stack & Tools

*   **Frontend**:

    *   Next.js 14 (with app router) for building the web app’s interface.
    *   TypeScript for type safety and scalable code.
    *   Tailwind CSS for responsive and customizable styling.
    *   Shadcn for enhanced styling and animations ensuring a premium UI experience.

*   **Backend & Storage**:

    *   Supabase for database management, authentication, and secure data storage.

*   **AI Features & Integrations**:

    *   GPT-4o for powering the Personal AI Assistant, enabling smart dialogues and contextual understanding.
    *   Integration with external APIs (Google Calendar for scheduling and Plaid for financial tracking).

*   **Additional Tools & IDE Integrations**:

    *   Bolt for quick project setup with AI-powered scaffolding.
    *   Windsurf as a modern IDE offering integrated AI coding capabilities.
    *   Replit for collaboration and online coding.
    *   Use of platforms like V0 by Vercel for AI-powered frontend component building.
    *   Complementary support from models such as Claude 3.7 Sonnet and Gemini 2.5 Pro for tackling complex challenges.

## 6. Non-Functional Requirements

*   **Performance**:

    *   Ensure fast load times and smooth animations, with updates reflecting in real-time.
    *   Target response times should remain within acceptable limits on modern web applications, even under high user load.

*   **Security**:

    *   All sensitive data to be encrypted in transit and at rest.
    *   Implement two-factor authentication (2FA) for secure logins.
    *   Regular vulnerability assessments and security audits to comply with GDPR and other relevant data privacy standards.

*   **Usability & Accessibility**:

    *   The app must be intuitive for a wide audience including both tech-savvy and less-experienced users.
    *   Responsive and touch-friendly design to support desktops, tablets, and smartphones.
    *   Consistent user interface with unobtrusive animations to aid navigation without overwhelming users.

*   **Scalability & Compliance**:

    *   The system is built to scale as the user base grows.
    *   All user interactions and data handling follow up-to-date privacy policies and standards.

## 7. Constraints & Assumptions

*   **Constraints**:

    *   Reliance on GPT-4o for the AI assistant features means performance is dependent on the availability and response times of the external AI service.
    *   Web search functionality will be limited to 10 searches per day per user to manage server load.
    *   The MVP will be designed as a web app only, postponing native mobile app development.

*   **Assumptions**:

    *   Users have access to reliable internet connections to ensure smooth interaction with the web app.
    *   The target demographic (professionals, students, and personal productivity enthusiasts) values design aesthetics, smooth animations, and integrated tools.
    *   Third-party API keys and integration policies (for calendars and financial APIs) are accessible with minimal restrictions.
    *   The app's data privacy and security protocols are assumed to be aligned with industry standards and legal regulations such as GDPR.

## 8. Known Issues & Potential Pitfalls

*   **AI Integration Challenges**:

    *   Dependence on GPT-4o may introduce latency or unavailability issues. Mitigation involves implementing fallback mechanisms or clear user notifications when AI services are down.

*   **API Rate Limits**:

    *   Both the AI and external APIs (e.g., for web search and financial data) could be subject to rate limits, potentially affecting user experience. Strategies include caching frequent queries and managing API quotas.

*   **Responsive Design Testing**:

    *   Ensuring a uniform experience across a diverse range of devices (desktop, tablet, mobile) can be challenging. Rigorous testing and progressive enhancement techniques are recommended to overcome this.

*   **Integration Complexity**:

    *   Incorporating multiple third-party services (e.g., Google Calendar, Plaid) requires keeping up with API changes and security measures. Maintaining clear integration guidelines and monitoring external service updates are crucial.

*   **Data Security & Privacy Compliance**:

    *   Handling sensitive user data necessitates vigilant security standards and compliance with data protection regulations. Continuous security audits and incorporating user-controlled data export/deletion features are key to managing this risk.

This PRD is intended to serve as a comprehensive and unambiguous reference for building Aaron's Personal Living. Every section—from the project overview down to potential pitfalls—has been outlined to ensure that subsequent technical documents can be generated without ambiguity.
