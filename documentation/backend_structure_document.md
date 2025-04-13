# Backend Structure Document for Aaron's Personal Living SaaS

This document outlines the backend structure, architecture, hosting, and security setup for Aaron's Personal Living, a personal life management SaaS. Every part is designed for scalability, performance, and user data protection. The following sections break down all the key components.

## Backend Architecture

The backend is built on a serverless, cloud-based setup with Supabase at its core. Supabase provides a PostgreSQL database, user authentication, and storage under one roof. Key details include:

- **Design Patterns & Frameworks:**
  - Use of modular design and microservices where applicable.
  - Supabase functions (edge functions) to manage server-side tasks and business logic.
  - Integration with third-party services (like GPT-4o for the AI assistant) through well-defined APIs.
  
- **Scalability, Maintainability, and Performance:**
  - Supabase’s cloud infrastructure guarantees that scaling up to meet user demand is straightforward.
  - The separation of concerns (database, auth, and storage managed in one platform) improves maintainability.
  - Real-time updates and fast response times are ensured through optimized database queries and edge functions.

## Database Management

The project leverages a SQL-based database offered by Supabase (PostgreSQL). The key aspects include:

- **Technologies Used:**
  - SQL (PostgreSQL via Supabase)
  - Supabase Auth for authentication
  - Supabase Storage for file management

- **Data Structuring & Storage:**
  - Data is organized into tables for tasks, habits, journals, notes, user profiles, and financial records.
  - Each table is designed to follow normalization rules where applicable, ensuring efficient and structured data storage.
  - Use of relational data models to link data such as user details with tasks and project planning activities.
  
- **Data Management Practices:**
  - Automated backups and periodic data integrity checks are in place.
  - Data encryption both at rest and in transit using industry-standard protocols.

## Database Schema

**Human Readable Description:**

- **Users Table:** Stores information like user ID, name, email, hashed password, and settings.
- **Tasks Table:** Each record includes a unique ID, user ID (to link with the user), title, description, due dates (with Today, Tomorrow, specific date options), category, and completion status.
- **Habits Table:** Contains habit ID, user ID, habit description, frequency (daily, weekly), reminders, and tracking progress data.
- **Journal Table:** Holds journal entry ID, user ID, date of entry, and the text content of the journal.
- **Notes Table:** Organizes notes by notebook ID, note ID, user ID, title and content fields, and a timestamp.
- **Financial Table (For Future Use):** To manage subscription tracking, budgeting percentages, expense logs and related transaction metadata.

**SQL Schema Example (PostgreSQL):**

/* Users Table */
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Tasks Table */
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Habits Table */
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  habit_description TEXT NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  reminder_time TIME,
  progress NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Journal Table */
CREATE TABLE journals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entry_date DATE NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Notes Table */
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notebook VARCHAR(100),
  title VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Financial Tools Table (Future Use) */
CREATE TABLE financials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50), -- e.g., 'subscription', 'expense'
  amount NUMERIC,
  description TEXT,
  transaction_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## API Design and Endpoints

The backend communicates with the frontend and third-party systems using RESTful endpoints, and where needed, GraphQL endpoints might be considered later. Key API details:

- **API Design:**
  - RESTful APIs primarily, enabling clear separation between resources (tasks, habits, journals, etc.).
  - Endpoints follow a conventional URL structure (e.g., /api/tasks, /api/habits) for ease of use and consistency.
  - Supabase provides auto-generated APIs for database tables, which are enhanced by custom serverless functions for business logic.

- **Key Endpoints Include:**
  - **Authentication:** /api/auth/login, /api/auth/signup, which handle user registration and login using Supabase Auth.
  - **Dashboard:** /api/dashboard to fetch an overview of user data for the personal hub.
  - **Task Management:** /api/tasks for CRUD operations on tasks. Also includes endpoints for scheduling and reminders.
  - **Habit Tracking:** /api/habits for tracking daily or weekly habits.
  - **Journaling & Notes:** /api/journals and /api/notes for creating, reading, updating, and deleting personal writings and notes.
  - **Integration Endpoints:** /api/integrations for managing connections with Google Calendar, Plaid, Stripe/PayPal, and potential Trello/Asana integrations.
  - **AI Assistant:** /api/assistant to manage interactions, cognition of past interactions (up to 30 per session), and web search limitations.

## Hosting Solutions

- **Primary Hosting Environment:**
  - The backend is hosted on Supabase, which is managed on robust cloud infrastructure.
  - For the frontend, Vercel supports hosting with its powerful CDN and edge network.
  
- **Benefits:**
  - Reliability: Cloud-based infrastructure with high uptime.
  - Scalability: Automatic scaling to handle increased user loads.
  - Cost-Effectiveness: Pay-as-you-grow pricing models reduce upfront costs and only scale in use.

## Infrastructure Components

- **Load Balancers:** Automatically managed by the cloud provider to distribute traffic evenly, ensuring no single server is overwhelmed.
- **Caching Mechanisms:** Usage of caching layers via Supabase and Vercel’s edge caching for frequently accessed content to improve response times.
- **Content Delivery Networks (CDNs):** Vercel’s integrated CDN distributes static assets globally, reducing latency.
- **Serverless Functions:** Supabase’s edge functions handle custom business logic seamlessly without the overhead of traditional server management.

## Security Measures

- **Authentication & Authorization:**
  - Two-factor authentication (2FA) through Supabase Auth enhances account security.
  - Role-based access controls and API key management ensure only authorized access.

- **Data Encryption:**
  - All data is encrypted during transmission (using SSL/TLS) and while stored at rest.
  
- **User Data Protection:**
  - Regular security audits and adherence to a strict privacy policy.
  - User data export (CSV/JSON) and account deletion to meet privacy regulations.

## Monitoring and Maintenance

- **Monitoring Tools:**
  - Built-in Supabase telemetry and logging for tracking backbone performance.
  - Third-party monitoring services (e.g., Sentry or similar) for error tracking and performance insights.

- **Maintenance Strategies:**
  - Regular backups of the PostgreSQL database.
  - Automated tests and continuous integration pipelines to ensure updates do not interrupt service.
  - Routine security audits and performance reviews to maintain optimal operations.

## Conclusion and Overall Backend Summary

The backend for Aaron's Personal Living is designed to provide a robust, scalable, and secure infrastructure to support personal life management features. Key strengths include:

- A modern, serverless architecture built on Supabase, handling database management, authentication, and storage.
- Well-defined RESTful API endpoints that support seamless communication between the frontend and backend.
- Cloud-hosting solutions that guarantee high reliability, scalability, and efficient cost management.
- Integrated infrastructure components such as load balancers, caching, and CDNs to boost performance and user experience.
- Strong security measures like 2FA, encryption, and regular audits, ensuring that user data remains safe and compliant.

This comprehensive setup positions the application to handle growth robustly while meeting user needs for a clean, responsive, and high-performing personal management tool.
