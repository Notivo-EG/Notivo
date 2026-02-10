<p align="center">
  <img src="public/logo.png" alt="Notiva Logo" width="80" >
</p>

<h1 align="center">Notiva</h1>

<p align="center">
  <strong>The AI-Powered All-in-One Study Platform</strong>
</p>

<p align="center">
  Upload once. Get flashcards, songs, videos, infographics, exams, and intelligent file classification.<br/>
  Google Gemini sits at the center of every feature.<br/>
  Built with Next.js 16, Supabase, and TypeScript.
</p>

<p align="center">
  <a href="https://notiva-eg.vercel.app/"><strong>🌐 Live Demo</strong></a>
</p>

<p align="center">
  <a href="#the-problem">Problem</a> &middot;
  <a href="#the-solution">Solution</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#demo">Demo</a> &middot;
  <a href="#screenshots">Screenshots</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="#project-structure">Project Structure</a> &middot;
  <a href="#database-schema">Database</a> &middot;
  <a href="#future-work">Future Work</a> &middot;
  <a href="#contributors">Contributors</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## The Problem

Students today juggle multiple disconnected tools. Notion for notes, Quizlet for flashcards, Google Drive for file storage, and YouTube for tutorials. This creates a fragmented and inefficient study experience that wastes time, breaks focus, and scatters knowledge everywhere. No single platform takes raw course materials and turns them into diverse, effective study formats. And when it comes to STEM content like mathematical equations, physics diagrams, circuit schematics, and statics figures, nearly every existing tool fails to generate them accurately.

---

## The Solution

**Notiva** is a unified, local-first academic platform. Students upload their PDFs, slides, or spreadsheets once and get six study tools generated from their actual course content:

| Tool | Description |
|------|-------------|
| **Smart Flashcards** | Question/answer pairs extracted from your materials |
| **Study Songs** | Gemini writes the lyrics, Suno produces the audio |
| **Video Tutorials** | Animated explainer videos derived from your uploads |
| **Infographics** | Visual summaries and diagrams of key concepts |
| **Practice Exams** | Realistic exams with automated grading matching your course style |
| **Material Classifier** | Automatic classification into lectures, problem sheets, research, etc. |

**Google Gemini** is the core intelligence behind every single feature. It powers file classification, generates all six study formats, reasons through complex STEM content to produce accurate figures and questions, and runs the entire pipeline from upload to exam grading. Even for song generation, where **Suno** handles the audio production, Gemini first analyzes the material and writes the lyrics and prompt. Every interaction in Notiva starts with Gemini.

---

## Demo

Watch the full walkthrough on YouTube:


[![Notiva Demo](https://img.youtube.com/vi/iAC3meCHx98/maxresdefault.jpg)](https://www.youtube.com/watch?v=iAC3meCHx98)


---

## Screenshots

<!-- Add your desktop screenshots here --> 
![Desktop Content Engine](public/Desktop%20view.png)

![Desktop Content Engine](public/Exam%20generation%20including%20STEM%20figures%20generation.png)

![Desktop Content Engine](public/Song%20Gneration.png)
---

## Features

### The 4-Year Architect
- Upload your major's course tree and visualize your entire academic journey
- Track multiple majors, minors, and certifications at the same time
- Mark courses as done, failed, in-progress, or locked with automatic prerequisite recalculation
- Visual dependency graph showing course relationships

### Study Tools (Gemini-Powered)
- **Flashcards** generated directly from uploaded lectures and slides
- **Study songs** where Gemini writes lyrics from your content and Suno produces the audio
- **Video tutorials** scripted and structured by Gemini from your materials
- **Infographics** with accurate STEM figures: circuits, free body diagrams, equations, physics visuals
- **Practice exams** with MCQ, True/False, written response, and problem-solving questions, all auto-graded
- **Material classification** that sorts uploads into lectures, problem sheets, syllabi, past exams, notes, and research

### Exam War Room
- See all upcoming exams across all your majors in one view
- Gemini generates tactical study plans based on your mastery profile
- Upload exam schedules (even as images) and Gemini parses them automatically

### Course Materials
- Upload PDFs, slides, spreadsheets, and images
- Gemini handles OCR, topic extraction, and classification on upload
- Reference textbook linking for smarter resource pruning

### UI/UX
- Glassmorphism design with dark and light mode
- Magnetic buttons, 3D card effects, smooth scroll animations
- Fully responsive on desktop and mobile
- Notebook decay visualization where neglected courses fade and wiggle as reminders
- Optional sound effects for interactions

---

## Tech Stack

| Category | Technology | Role |
|----------|------------|------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Full-stack React framework |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | Scroll and interaction animations |
| **Database and Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) | Backend, authentication, file storage |
| **AI Engine** | [Google Gemini](https://ai.google.dev/) | Core intelligence for all features |
| **Music Generation** | [Suno](https://suno.com/) | Audio production for study songs |
| **Icons** | [Lucide React](https://lucide.dev/) | Icon library |
| **Fonts** | [Geist](https://vercel.com/font) | Typography |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- Google AI API key (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notiva.git
   cd notiva
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google Gemini
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**

   Run the SQL migrations in your Supabase project:
   ```bash
   psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
   psql -h your-db-host -U postgres -d postgres -f supabase/triggers.sql
   ```

   Or paste the contents of `supabase/schema.sql` and `supabase/triggers.sql` into the Supabase SQL Editor.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
notiva/
├── public/
│   └── sounds/                # Sound effect files
├── src/
│   ├── app/
│   │   ├── actions.ts         # Server actions (AI calls, uploads)
│   │   ├── course/            # Course detail pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── login/             # Authentication
│   │   ├── signup/            # Registration
│   │   ├── major/             # Major/program pages
│   │   ├── settings/          # User preferences
│   │   ├── setup/             # Onboarding flow
│   │   ├── tools/             # Study tools (flashcards, quizzes, etc.)
│   │   └── war-room/          # Exam planning
│   ├── components/
│   │   ├── CourseCard.tsx
│   │   ├── CourseTree.tsx
│   │   ├── FileUpload.tsx
│   │   ├── Navbar.tsx
│   │   ├── dashboard/
│   │   └── ui/
│   ├── context/               # React context providers
│   ├── lib/
│   │   ├── gemini.ts          # Gemini AI configuration
│   │   ├── supabase/          # Supabase client setup
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript type definitions
├── supabase/
│   ├── schema.sql             # Database schema
│   ├── triggers.sql           # Database triggers
│   └── migrations/            # Migration files
└── package.json
```

---

## Database Schema

PostgreSQL via Supabase with Row Level Security on all tables.

| Table | Description |
|-------|-------------|
| `profiles` | User profiles extending Supabase Auth |
| `enrollments` | Academic programs (majors/minors) per user |
| `student_courses` | Courses with status, grades, and AI configuration |
| `course_materials` | Uploaded files with Gemini-classified types |
| `mastery_profiles` | Gemini-generated learning analytics per course |
| `course_prerequisites` | Prerequisite graph edges |
| `flashcards` | Gemini-generated flashcards |
| `video_recommendations` | Curated video suggestions |

---

## Future Work

- Adaptive learning styles tailored to each student and each course, adjusting based on performance and preference
- A real-time conversational tutor where students talk with Gemini directly, with Gemini pulling images and videos from the internet to explain concepts like a teacher standing in front of you
- Seamless Google Drive linking so course materials sync automatically as instructors upload them
- Spaced repetition scheduling for flashcards
- Google Calendar and iCal integration
- Collaborative study rooms
- React Native mobile app
- Grade prediction based on mastery data

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Guidelines

- Follow existing code style (Prettier + ESLint)
- Add TypeScript types for all new code
- Test responsive design and dark/light mode compatibility
- Write meaningful commit messages

---

## Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/fady-nasser"><img src="https://github.com/fady-nasser.png" width="80" alt="fady-nasser"/><br/><sub><b>fady-nasser</b></sub></a></td>
    <td align="center"><a href="https://github.com/Ammar880121"><img src="https://github.com/Ammar880121.png" width="80" alt="Ammar880121"/><br/><sub><b>Ammar880121</b></sub></a></td>
    <td align="center"><a href="https://github.com/BasselM0stafa"><img src="https://github.com/BasselM0stafa.png" width="80" alt="BasselM0stafa"/><br/><sub><b>BasselM0stafa</b></sub></a></td>
    <td align="center"><a href="https://github.com/MahmoudZah"><img src="https://github.com/MahmoudZah.png" width="80" alt="MahmoudZah"/><br/><sub><b>MahmoudZah</b></sub></a></td>
    <td align="center"><a href="https://github.com/MhmdSheref"><img src="https://github.com/MhmdSheref.png" width="80" alt="MhmdSheref"/><br/><sub><b>MhmdSheref</b></sub></a></td>
    <td align="center"><a href="https://github.com/Noureldin-Islam-2006"><img src="https://github.com/Noureldin-Islam-2006.png" width="80" alt="Noureldin-Islam-2006"/><br/><sub><b>Noureldin-Islam-2006</b></sub></a></td>
    <td align="center"><a href="https://github.com/AhmadEnan"><img src="https://github.com/AhmadEnan.png" width="80" alt="AhmadEnan"/><br/><sub><b>AhmadEnan</b></sub></a></td>
  </tr>
</table>

---

## License

Open source under the [MIT License](LICENSE).

---

## Acknowledgments

- [Google Gemini](https://ai.google.dev/) for powering every AI feature in Notiva
- [Suno](https://suno.com/) for music generation
- [Supabase](https://supabase.com/) for backend infrastructure
- [Next.js](https://nextjs.org/) for the framework
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

<p align="center">
  Made by students, for students.
</p>
