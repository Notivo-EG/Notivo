<p align="center">
  <img src="public/favicon.ico" alt="Notiva Logo" width="80" height="80">
</p>

<h1 align="center">Notiva</h1>

<p align="center">
  <strong>The Everything App for Students</strong>
</p>

<p align="center">
  An all-in-one replacement for Notion, Quizlet, and your disorganized Google Drive.<br/>
  Open source, local-first academic planner built with Next.js 16 and Supabase.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#database-schema">Database</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

### 🎓 The 4-Year Architect
- **Curriculum Tree Visualization** - Upload your major's course tree and visualize your entire academic journey
- **Multi-Major Support** - Track multiple majors, minors, and certifications simultaneously
- **Progress Tracking** - Mark courses as done, failed, in-progress, or locked with automatic path recalculation
- **Prerequisites Graph** - Visual representation of course dependencies

### 🧠 Brain & Study System
- **Smart Resource Pruning** - AI identifies which materials are most relevant based on professor history
- **AI-Powered Flashcards** - Generate flashcards from your uploaded course materials using Google Gemini
- **Quiz Generation** - Create customized quizzes with multiple question types:
  - Multiple Choice (Concepts & Problems)
  - True/False
  - Written Response (Concepts & Problems)
- **Mastery Profiles** - Track your understanding across different concepts and cognitive skills

### 📅 Exam War Room
- **Centralized Exam View** - See all upcoming exams across all majors in one place
- **Smart Study Plans** - AI-generated tactical study plans based on your personal mastery profile
- **Schedule Import** - Upload your exam schedule (even as images) for automatic parsing

### 📚 Course Materials Management
- **Multi-Type Support** - Upload syllabi, slides, sheets, past exams, notes, and problem sheets
- **AI Extraction** - Automatic OCR and topic extraction from uploaded materials
- **Video Recommendations** - AI-curated YouTube videos relevant to your weak areas

### 🎨 Premium UI/UX
- **Glassmorphism Design** - Modern, premium aesthetic with subtle animations
- **Dark/Light Mode** - Full theme support with smooth transitions
- **Responsive Design** - Optimized for desktop and mobile devices
- **Micro-interactions** - Magnetic buttons, 3D card effects, and smooth scroll animations
- **Sound Effects** - Optional haptic audio feedback for interactions
- **Notebook Decay Visualization** - Courses fade and wiggle when neglected as visual reminders

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + Auth) |
| **AI** | [Google Gemini](https://ai.google.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Fonts** | [Geist](https://vercel.com/font) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (for backend)
- Google AI API key (for Gemini features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notiva.git
   cd notiva
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Gemini AI
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase project:
   ```bash
   # Apply the schema
   psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
   
   # Apply triggers
   psql -h your-db-host -U postgres -d postgres -f supabase/triggers.sql
   ```
   
   Or copy the contents of `supabase/schema.sql` and `supabase/triggers.sql` into the Supabase SQL Editor.

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
notiva/
├── public/                 # Static assets
│   └── sounds/            # Sound effect files
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── actions.ts     # Server actions (AI, uploads)
│   │   ├── course/        # Course detail pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── login/         # Authentication
│   │   ├── signup/        # Registration
│   │   ├── major/         # Major/program pages
│   │   ├── settings/      # User preferences
│   │   ├── setup/         # Onboarding flow
│   │   ├── tools/         # Additional utilities
│   │   └── war-room/      # Exam planning
│   ├── components/        # Reusable UI components
│   │   ├── CourseCard.tsx
│   │   ├── CourseTree.tsx
│   │   ├── FileUpload.tsx
│   │   ├── Navbar.tsx
│   │   ├── dashboard/
│   │   └── ui/
│   ├── context/           # React context providers
│   ├── lib/               # Utility libraries
│   │   ├── gemini.ts      # Google AI configuration
│   │   ├── supabase/      # Supabase client setup
│   │   └── utils.ts       # Helper functions
│   └── types/             # TypeScript type definitions
├── supabase/              # Database schema & migrations
│   ├── schema.sql         # Main database schema
│   ├── triggers.sql       # Database triggers
│   └── migrations/        # Migration files
└── package.json
```

---

## 🗄️ Database Schema

The application uses a PostgreSQL database (via Supabase) with the following main tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles extending Supabase Auth |
| `enrollments` | Academic programs (majors/minors) per user |
| `student_courses` | Individual courses with status, grades, and AI config |
| `course_materials` | Uploaded files (syllabi, slides, exams, etc.) |
| `mastery_profiles` | AI-generated analytics per course |
| `course_prerequisites` | Prerequisite relationships (graph edges) |
| `flashcards` | Generated flashcards for active recall |
| `video_recommendations` | AI-curated YouTube recommendations |

All tables implement Row Level Security (RLS) to ensure users can only access their own data.

---

## 🎯 Roadmap

- [ ] Spaced repetition algorithm for flashcards
- [ ] Calendar integration (Google Calendar, iCal)
- [ ] Collaborative study rooms
- [ ] Mobile app (React Native)
- [ ] PDF annotation and highlighting
- [ ] Professor rating system
- [ ] Grade prediction analytics
- [ ] Export to PDF/Markdown

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (Prettier + ESLint)
- Write meaningful commit messages
- Add TypeScript types for all new code
- Test responsive design on multiple screen sizes
- Ensure dark/light mode compatibility

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Google Gemini](https://ai.google.dev/) - Generative AI

---

<p align="center">
  Made with ❤️ by students, for students
</p>
