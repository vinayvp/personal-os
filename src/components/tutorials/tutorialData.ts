export interface TutorialSection {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

export interface SubappTutorial {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  overview: string;
  sections: TutorialSection[];
  proTips: string[];
}

export const SUBAPP_TUTORIALS: Record<string, SubappTutorial> = {
  tracking: {
    id: 'tracking',
    name: 'Habit Tracker',
    iconName: 'TrendingUp',
    tagline: 'Build lasting consistency with streak tracking and monthly activity heatmaps.',
    overview:
      'The Habit Tracker helps you cultivate positive routines and break bad ones. Define custom habits with flexible frequencies (daily, weekly, or specific weekdays), record daily progress with a single tap, and monitor your momentum over time.',
    sections: [
      {
        title: '1. Creating a Habit',
        description: 'Set up intentional, measurable habits with customizable schedules and visual identities.',
        steps: [
          'Click the "+ Add Habit" button in the tracker header.',
          'Enter a clear habit name (e.g., "Morning Cardio", "Read 20 pages", "Deep Work Session").',
          'Choose an icon, accent color, and frequency (Everyday, Weekly Target, or Custom Days of the week).',
          'Optionally specify a goal target (e.g. "30 minutes") and an end date if it is a 30-day or 90-day challenge.',
        ],
      },
      {
        title: '2. Daily Check-ins & Streak Counter',
        description: 'Maintain your chain of consistency.',
        steps: [
          'Check off today’s completed habits directly from the daily dashboard list.',
          'Your Current Streak increments automatically each day you complete the habit.',
          'If you miss a scheduled day, the streak resets to encourage renewed commitment.',
          'Click on any habit card to open its detailed completion calendar and view historical logs.',
        ],
      },
      {
        title: '3. Analytics & Heatmap View',
        description: 'Visualize your long-term consistency patterns.',
        steps: [
          'Switch to the Heatmap or Monthly Grid view to observe completion density.',
          'Identify your most consistent days of the week and uncover potential friction points.',
          'Use the month-over-month completion rate to measure overall discipline.',
        ],
      },
    ],
    proTips: [
      'Start small with 2–3 micro-habits before expanding to larger routines.',
      'Group related habits (e.g., morning routine habits vs. evening wind-down habits) using consistent color accents.',
      'Check off habits immediately after completing them to reinforce psychological reward loops.',
    ],
  },

  todos: {
    id: 'todos',
    name: 'Todo App',
    iconName: 'CheckSquare',
    tagline: 'Stay organized, prioritize essential tasks, and hit your deadlines.',
    overview:
      'The Todo App provides a focused task management workspace. Categorize your to-dos, set priorities and deadlines, filter by completion status, and maintain clarity over your daily deliverables.',
    sections: [
      {
        title: '1. Adding & Organizing Tasks',
        description: 'Capture tasks as soon as they arise.',
        steps: [
          'Click "Add Task" or use the quick-entry input at the top.',
          'Set a descriptive task title and optional detailed notes or sub-tasks.',
          'Assign a Priority level: High (urgent), Medium (normal), or Low (backlog).',
          'Set a target Due Date to keep critical deadlines in focus.',
        ],
      },
      {
        title: '2. Filtering & Search',
        description: 'Find what matters right now without visual clutter.',
        steps: [
          'Use the search bar to filter tasks by title or keywords instantly.',
          'Filter by Priority (High, Medium, Low) to tackle top-impact tasks first.',
          'Toggle between "Active", "Completed", and "All" views to review accomplishments.',
        ],
      },
      {
        title: '3. Task Completion & Archiving',
        description: 'Keep your active workspace clean and motivating.',
        steps: [
          'Click the checkbox beside any task to mark it completed with a satisfying check.',
          'Edit tasks anytime to adjust notes, reschedule due dates, or re-prioritize.',
          'Delete or clear finished tasks when you no longer need them.',
        ],
      },
    ],
    proTips: [
      'Limit each day to a maximum of 3 High-priority tasks (the Rule of 3).',
      'Review your active task list every morning for 3 minutes before starting work.',
      'Keep task titles actionable with verbs (e.g., "Draft quarterly roadmap" instead of "Roadmap").',
    ],
  },

  notes: {
    id: 'notes',
    name: 'Notes App',
    iconName: 'FileText',
    tagline: 'Capture thoughts, code snippets, and ideas with rich Markdown and tagging.',
    overview:
      'The Notes App is your personal knowledge base. Write formatted markdown notes, attach searchable tags, organize categories, and pin essential documents to the top for immediate access.',
    sections: [
      {
        title: '1. Writing & Formatting Notes',
        description: 'Enjoy full Markdown support for technical and personal documentation.',
        steps: [
          'Click "+ New Note" to open the interactive note editor.',
          'Write using standard Markdown: headers (`#`, `##`), lists (`-`), code blocks (` ``` `), and tables.',
          'Preview rendered Markdown side-by-side or toggle preview mode.',
        ],
      },
      {
        title: '2. Tagging & Categories',
        description: 'Structure your notes for effortless discovery.',
        steps: [
          'Add one or more tags (e.g., `#architecture`, `#ideas`, `#meeting-notes`).',
          'Filter the notes library by clicking on any tag in the sidebar.',
          'Use the global search bar to instantly query across note titles, tags, and content.',
        ],
      },
      {
        title: '3. Pinning Important Notes',
        description: 'Keep your reference docs front and center.',
        steps: [
          'Click the Pin icon on any note card to pin it to the top of your library.',
          'Pinned notes appear in a dedicated section above chronological notes for instant access.',
        ],
      },
    ],
    proTips: [
      'Use code blocks with syntax highlighting to save reusable code snippets and commands.',
      'Link external references and documentation inside note bodies using Markdown links.',
      'Pin your active sprint or weekly goals note so it stays visible every time you open Notes.',
    ],
  },

  lessons: {
    id: 'lessons',
    name: 'Lessons Learned',
    iconName: 'BookOpen',
    tagline: 'Record career and life learnings to foster continuous improvement.',
    overview:
      'The Lessons Learned repository preserves key insights gained from successes, challenges, and post-mortems. Categorize insights, document practical takeaways, and periodically review them to avoid repeating past mistakes.',
    sections: [
      {
        title: '1. Documenting a Lesson',
        description: 'Transform experiences into durable principles.',
        steps: [
          'Click "+ Add Lesson" to create an entry.',
          'Provide a concise Title summarizing the core takeaway.',
          'Select or create a Category (e.g., "Engineering", "Leadership", "Decision Making").',
          'Elaborate on the Context (what happened), the Root Cause, and the Key Takeaway.',
        ],
      },
      {
        title: '2. Categorization & Impact Analysis',
        description: 'Structure insights by discipline.',
        steps: [
          'Organize lessons into categories like Architecture, Communication, Project Management, and Investing.',
          'Tag entries with severity/impact ratings to highlight pivotal turning points.',
        ],
      },
      {
        title: '3. Periodic Reflection',
        description: 'Reinforce mental models.',
        steps: [
          'Filter by category to prepare for similar projects or decisions.',
          'Review previous post-mortems to ensure systems and workflows have improved.',
        ],
      },
    ],
    proTips: [
      'Write lessons in the present tense as actionable rules of thumb.',
      'Include what you would do differently next time under similar circumstances.',
      'Revisit your top lessons quarterly during personal reviews.',
    ],
  },

  movies: {
    id: 'movies',
    name: 'Movies & TV',
    iconName: 'Film',
    tagline: 'Track your watchlist, record ratings, and import media directly from IMDb.',
    overview:
      'The Movies & TV tracker keeps your entertainment life organized. Track titles you want to watch or have watched, record personal ratings and reviews, categorize by streaming platforms, and automatically import metadata directly from IMDb links.',
    sections: [
      {
        title: '1. Instant IMDb URL Import',
        description: 'Import movie and TV details automatically.',
        steps: [
          'Copy any IMDb title link (e.g. `imdb.com/title/tt0804484`).',
          'Paste it into the Add Movie dialog or share it to the app on mobile.',
          'The app automatically extracts the title, year, IMDb ID, and poster metadata.',
        ],
      },
      {
        title: '2. Watchlist vs. Watched',
        description: 'Manage your entertainment pipeline.',
        steps: [
          'Add upcoming films and shows to your Watchlist.',
          'When finished, mark them as Watched, assign your personal Star Rating, and write quick impressions.',
          'Track season and episode progress for ongoing television series.',
        ],
      },
      {
        title: '3. Streaming Platforms & Genres',
        description: 'Know where to stream what.',
        steps: [
          'Tag movies by streaming platform (Netflix, Prime, Max, Apple TV+, Hotstar).',
          'Filter by platform when deciding what to stream tonight with friends or family.',
        ],
      },
    ],
    proTips: [
      'Share IMDb links directly from your mobile browser or IMDb app using the system share sheet.',
      'Filter by your 5-star ratings whenever someone asks for movie recommendations.',
      'Use the genre filters to match your current viewing mood.',
    ],
  },

  financial: {
    id: 'financial',
    name: 'Finance & Portfolio',
    iconName: 'DollarSign',
    tagline: 'Monitor SIP investments, crypto allocations, and portfolio distribution.',
    overview:
      'The Financial dashboard aggregates your long-term wealth building. Track Systematic Investment Plans (SIPs), monitor cryptocurrency holdings with live valuations, and visualize your diversified asset allocation.',
    sections: [
      {
        title: '1. Managing SIP Investments',
        description: 'Keep your mutual fund and equity SIP schedules disciplined.',
        steps: [
          'Click "+ Add SIP" to record a systematic investment plan.',
          'Enter the Fund Name, Monthly Amount, Category (Equity, Debt, Hybrid, Index), and Monthly Debit Date.',
          'Track total invested capital and projected future value based on compounding growth.',
        ],
      },
      {
        title: '2. Crypto Assets & Live Tracking',
        description: 'Monitor decentralized portfolio distribution.',
        steps: [
          'Add crypto assets (e.g., BTC, ETH, SOL) with quantity held and purchase cost.',
          'View real-time valuations and percentage weight in your overall portfolio.',
        ],
      },
      {
        title: '3. Allocation Breakdown & Analytics',
        description: 'Ensure your risk is well-balanced across asset classes.',
        steps: [
          'Inspect the asset allocation distribution chart.',
          'Ensure your investments align with your risk tolerance and financial milestones.',
        ],
      },
    ],
    proTips: [
      'Set automated calendar reminders for your monthly SIP debit dates.',
      'Rebalance your equity vs. debt allocation once per year.',
      'Focus on long-term compound growth rather than short-term market fluctuations.',
    ],
  },

  revision: {
    id: 'revision',
    name: 'Revision & Spaced Repetition',
    iconName: 'Repeat',
    tagline: 'Master complex topics through scientifically proven spaced repetition intervals.',
    overview:
      'The Revision app applies spaced repetition principles to learning. Create revision cards across subjects, track review intervals (1 day, 3 days, 1 week, 2 weeks, 1 month), and solidify long-term retention of technical and academic concepts.',
    sections: [
      {
        title: '1. Adding Concepts & Flashcards',
        description: 'Deconstruct complex subjects into bite-sized retention elements.',
        steps: [
          'Create a Category (e.g., "System Design", "Algorithms", "AWS Cloud", "Languages").',
          'Add revision elements with a Concept Prompt, Detailed Answer, and Difficulty level.',
        ],
      },
      {
        title: '2. Review Sessions & Spaced Intervals',
        description: 'Review items right before the forgetting curve takes effect.',
        steps: [
          'Check the "Due for Review" queue each day.',
          'Test yourself on the concept before revealing the answer.',
          'Rate your recall: Easy (advances to next interval), Medium, or Hard (resets interval).',
        ],
      },
      {
        title: '3. Focus Mode',
        description: 'Immersive distraction-free learning.',
        steps: [
          'Launch Focus View to practice flashcards in a clean, full-screen deck interface.',
          'Flip cards to verify your knowledge and track your session score.',
        ],
      },
    ],
    proTips: [
      'Perform a 10-minute revision session daily rather than cramming once a week.',
      'Formulate questions that test core mechanisms rather than mere trivia.',
      'If you struggle with a card multiple times, rewrite the explanation in simpler language.',
    ],
  },

  jobs: {
    id: 'jobs',
    name: 'Job Tracker',
    iconName: 'Briefcase',
    tagline: 'Track applications, calculate multi-source ATS scores, and log outreach follow-ups.',
    overview:
      'The Job Tracker is a career pipeline management center. Log job applications across all stages, evaluate resume ATS match scores across tools like ChatGPT and Jobscan, track outreach interactions, manage saved links, and analyze conversion metrics.',
    sections: [
      {
        title: '1. Logging Job Applications',
        description: 'Keep track of every opportunity with comprehensive metadata.',
        steps: [
          'Click "+ Add Application" or import a job link directly from LinkedIn, Indeed, or Ashby.',
          'Record Company Name, Role, Location (City & Country), Job Type (Full-time, Remote, Hybrid), and Expected Salary.',
          'Upload or link tailored Resumes and Cover Letters for quick reference before interviews.',
        ],
      },
      {
        title: '2. Multi-Source ATS Match Calculator',
        description: 'Benchmark your resume against job descriptions.',
        steps: [
          'Click the "ATS" calculator button in the creation or edit modal.',
          'Input your resume ATS scores from sources like ChatGPT, Jobscan, Teal, and Resume Worded.',
          'The calculator automatically computes the arithmetic average and associates platform metadata.',
          'Color-coded badges (Green $\\ge 80\\%$, Yellow $60-79\\%$, Red $< 60\\%$) display on cards and tables.',
        ],
      },
      {
        title: '3. Outreach & Follow-up Timeline',
        description: 'Never let an application slip through the cracks.',
        steps: [
          'Open any application details dialog and navigate to "Follow-ups & Outreach Timeline".',
          'Log interactions: select Channel (Email, LinkedIn, Phone Call, Message, In-Person), date, and notes.',
          'Keep chronological records of recruiter communications and scheduled interviews.',
        ],
      },
      {
        title: '4. Responsive Views: Cards vs. Table',
        description: 'Optimal layout for any screen size.',
        steps: [
          'Mobile view defaults to touch-friendly Card View.',
          'Desktop view defaults to Table View with optimized column widths for rapid scanning.',
          'Toggle between views at any time using the layout buttons in the filter bar.',
        ],
      },
    ],
    proTips: [
      'Aim for an average ATS score of 80%+ by tailoring keywords from the job description before applying.',
      'Log a follow-up 5–7 business days after submitting an application if you haven’t received a response.',
      'Use the Platforms tab to see which job boards yield the highest recruiter response rates.',
    ],
  },
};

