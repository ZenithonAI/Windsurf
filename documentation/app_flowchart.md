flowchart TD
    Start[Start] --> Auth[User Authentication]
    Auth --> Dashboard[Dashboard]

    Dashboard --> TaskManagement[Task Management]
    TaskManagement --> AddTask[Add Task Details]
    TaskManagement --> ViewTasks[View Tasks (Today, Tomorrow, Next 7 Days)]
    ViewTasks --> TaskActions[Mark Complete / Edit / Delete]
    TaskManagement --> CalendarSync[Google Calendar Sync]

    Dashboard --> HabitTracking[Habit Tracking]
    HabitTracking --> AddHabit[Add Habit & Set Frequency]
    HabitTracking --> SetReminder[Set Reminders]
    HabitTracking --> TrackProgress[View Habit Progress]

    Dashboard --> ProjectPlanning[Project Planning]
    ProjectPlanning --> AddProject[Add Project with Details]
    ProjectPlanning --> BreakTasks[Break into Tasks / Sub-goals]
    BreakTasks --> TrackMilestones[Track Milestones]

    Dashboard --> Goals[Goals]
    Goals --> SetGoals[Set Personal / Professional Goals]
    Goals --> MonitorGoals[Monitor Progress]

    Dashboard --> Journal[Journal]
    Journal --> DailyJournal[Daily Journaling]

    Dashboard --> Notes[Notes]
    Notes --> OrganizeNotes[Organize Notes in Notebooks]

    Dashboard --> FinancialManagement[Financial Management]
    FinancialManagement --> SubscriptionTracking[Track Subscriptions]
    FinancialManagement --> BudgetTools[Budgeting: Income / Expenses]
    FinancialManagement --> PlaidIntegration[Plaid Integration]
    FinancialManagement --> PaymentProcessing[Stripe & PayPal Processing]

    Dashboard --> PersonalAI[Personal AI Assistant]
    PersonalAI --> ChatModule[Conversational AI Chat]
    PersonalAI --> RecallHistory[Recall Last 30 Interactions]
    PersonalAI --> WebSearch[Web Search (10/day)]

    Dashboard --> AccountSettings[Account Settings]
    AccountSettings --> DataExport[Data Export (CSV/JSON)]
    AccountSettings --> TwoFA[Two-Factor Authentication]
    AccountSettings --> AccountDeletion[Account Deletion]
    AccountSettings --> PrivacyPolicy[Privacy Policy & Security Audits]