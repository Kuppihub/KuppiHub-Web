# KuppiHub - Student Learning Management System

A modern, structured frontend for managing academic modules and student-created supplementary videos (kuppi) built with Next.js and Tailwind CSS.

## 🎯 What is Kuppi?

"Kuppi" refers to supplementary learning materials created by students to help their peers understand complex topics. These can include:
- Video explanations
- Study notes
- Practice problems
- Concept summaries
- Telegram download links
- Additional learning resources

## 🏗️ System Architecture

The system follows a simplified hierarchical structure:
1. **Faculty** → **Department** → **Semester** → **Modules** → **Kuppi Videos**
2. Users can view all available modules for their semester
3. Each module contains student-created kuppi videos with embedded YouTube players

## 🚀 Features 

### Core Functionality
- **Simplified Selection**: Faculty → Department → Semester → Modules
- **Module Discovery**: View all available modules for the semester
- **Kuppi Browsing**: Browse and view student-created learning materials
- **YouTube Integration**: Embedded video players for seamless viewing
- **Resource Sharing**: Access Telegram links and material files

### User Experience
- **Progressive Flow**: Step-by-step selection process
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Intuitive Navigation**: Clear back buttons and breadcrumbs
- **Visual Feedback**: Loading states, error handling, and success messages

### Content Management
- **Video URLs**: Multiple video sources (YouTube, etc.)
- **Telegram Links**: Direct download links
- **Material Files**: Notes, PDFs, and additional resources
- **Metadata**: Titles, descriptions, and timestamps
- **Read-only Access**: Browse and view existing kuppi content

## 📁 Project Structure

```
src/app/
├── page.tsx                 # Home page (redirects to faculty)
├── faculty/page.tsx         # Faculty selection
├── department/page.tsx      # Department selection
├── semester/page.tsx       # Semester selection + Module display
├── module-kuppi/page.tsx   # View kuppi videos for a specific module
├── dashboard/page.tsx      # Main dashboard with modules

├── videos/page.tsx         # View all videos for a module
├── browse-kuppi/page.tsx   # Browse all kuppi videos
└── my-kuppi/page.tsx      # Manage user's own kuppi
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **State Management**: React hooks with localStorage
- **Database**: Supabase PostgreSQL (ready for integration)

## 🗄️ Database Schema

The system is designed to work with the following PostgreSQL tables:

```sql
-- Core tables
faculties (id, name)
departments (id, name, faculty_id)
batches (id, name)
semesters (id, name)
students (id, name, faculty_id, department_id, batch_id, semester_id, image_url)

-- Module management
modules (id, code, name, description)
module_assignments (id, module_id, faculty_id, department_id, batch_id, semester_id)
student_additional_modules (id, student_id, module_id)

-- Video content
videos (id, module_id, title, youtube_links, telegram_links, material_urls, is_kuppi, student_id, created_at)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kuppihub-advanced
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧑‍💻 Developer Setup (Local Supabase + App)

This project supports a full local Supabase stack using Docker via the Supabase CLI.

### 1) Install Supabase CLI
```bash
npm install -g supabase
```

### 2) Create your `.env`
Copy from `env.example` and fill it:
```bash
cp env.example .env
```

### 3) Sync migrations to Supabase CLI
```bash
./scripts/supabase-sync-migrations.sh
```

### 4) Start local Supabase (Docker)
```bash
supabase start
```

The CLI will print local URLs and keys. Update your `.env` with those values:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

### 5) Run the app
```bash
npm run dev
```

App: `http://localhost:3000`

### 6) Stop local Supabase
```bash
supabase stop
```

## 🐳 Docker (App Only)

If you want the app running in Docker (using a hosted Supabase):

```bash
docker compose up --build
```

## 🐳 Docker (Postgres Only, No Supabase CLI)

If you only want a local Postgres database (no Supabase services):

```bash
docker compose -f docker-compose.db.yml up --build
```

This will:
1. Start Postgres on `localhost:5432`
2. Run all SQL files in `supabase_migrations/` on first startup

Default credentials:
```text
DB: kuppihub
USER: kuppihub
PASS: kuppihub
```

Stop and remove data:
```bash
docker compose -f docker-compose.db.yml down -v
```

## 🔧 Configuration

### Supabase Integration

To connect with your Supabase database:

1. **Install Supabase client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create environment variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Replace mock data calls** in each page component with actual Supabase queries

### Local Supabase (Docker via Supabase CLI)

This project can run a full local Supabase stack in Docker using the Supabase CLI.

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Sync migrations**
   ```bash
   ./scripts/supabase-sync-migrations.sh
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```

4. **Update `.env` for local**
   Use the URLs/keys printed by `supabase start` and set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
   ```

5. **Run the app**
   ```bash
   npm run dev
   ```

### Example Supabase Query

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Fetch faculties
const { data: faculties, error } = await supabase
  .from('faculties')
  .select('*')
  .order('name')
```

### Approved Video Email Webhook

When a `videos` row is approved (`is_approved = true` on insert, or `false -> true` on update), a DB trigger sends a POST request to your email service.

1. **Apply migrations**
   Ensure SQL in `supabase_migrations/` is applied, including:
   - `20260329_video_approval_email_webhook.sql`

2. **Update database config values**
   The trigger reads values from `public.system_config`:
   - `emaildata_webhook_url`
   - `emaildata_webhook_secret`

   Update them directly in DB when needed:
   ```sql
   UPDATE public.system_config
   SET value = 'https://your-email-endpoint.example', updated_at = now()
   WHERE name = 'emaildata_webhook_url';

   UPDATE public.system_config
   SET value = 'your_shared_secret', updated_at = now()
   WHERE name = 'emaildata_webhook_secret';
   ```

3. **Verify requests in email service**
   The trigger sends headers:
   - `x-webhook-secret: <emaildata_webhook_secret value>`
   - `x-webhook-source: kuppihub-db-trigger`

   Validate `x-webhook-secret` on the email endpoint before processing.
   Payload includes `emails_list` as an array of objects: `{ name, email }`.

## 🎨 Customization

### Colors and Themes
The system uses Tailwind CSS with a consistent color scheme:
- **Blue**: Primary actions and navigation
- **Green**: Success states and confirmations
- **Purple**: Kuppi-related elements
- **Orange**: Creation and editing actions
- **Red**: Destructive actions

### Component Styling
Each page uses gradient backgrounds and consistent card layouts:
- Rounded corners (`rounded-lg`)
- Subtle shadows (`shadow-lg`)
- Hover effects (`hover:shadow-xl`)
- Smooth transitions (`transition-all`)

## 📱 Responsive Design

The system is fully responsive with:
- **Mobile-first approach**
- **Grid layouts** that adapt to screen size
- **Touch-friendly buttons** and interactions
- **Optimized spacing** for different devices

## 🔒 Security Considerations

- **No authentication required** (as per requirements)
- **Input validation** on forms
- **URL sanitization** for external links
- **XSS prevention** through proper React practices

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
The system can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- **User Authentication**: Login and user profiles
- **Real-time Updates**: Live notifications and chat
- **Advanced Search**: Full-text search and filters
- **Analytics Dashboard**: Usage statistics and insights
- **Mobile App**: React Native companion app
- **API Integration**: RESTful API for external access

---

**Built with ❤️ for the student community**
