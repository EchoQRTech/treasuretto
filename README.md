# TreasureTto - Reseller Toolkit

A comprehensive toolkit for vintage and streetwear resellers, built with Next.js, Supabase, and Lemon Squeezy.

## Features

- 🔐 User authentication with Supabase Auth
- 💳 Subscription management with Lemon Squeezy
- 🛠️ Comprehensive reselling tools and resources
- 📊 Dashboard with analytics and insights
- 🎨 Modern, responsive UI with Tailwind CSS

## Setup Instructions

### 1. Environment Variables

Copy `env.example` to `.env.local` and fill in your configuration:

```bash
cp env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `LEMON_SQUEEZY_SIGNING_SECRET` - Your Lemon Squeezy webhook signing secret
- `LEMON_SQUEEZY_BASIC_PLAN_ID` - Your Lemon Squeezy variant ID
- `LEMON_SQUEEZY_STORE_ID` - Your Lemon Squeezy store ID
- `NEXT_PUBLIC_APP_URL` - Your application URL (e.g., http://localhost:3000)

### 2. Database Setup

Run the SQL commands in `database_schema.sql` in your Supabase SQL editor to create the required tables:

- `profiles` - User profile information
- `subscriptions` - Subscription data from Lemon Squeezy

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── vault/             # Vault dashboard
│   └── ...                # Other pages
├── lib/                   # Utility functions
│   ├── config.ts          # Configuration constants
│   └── supabase.ts        # Supabase client setup
└── types/                 # TypeScript type definitions
    └── supabase.ts        # Generated Supabase types
```

## Key Features

### Authentication
- Email/password signup and login
- Password reset functionality
- Email confirmation flow
- Protected routes

### Subscription Management
- Lemon Squeezy integration
- Webhook handling for subscription events
- User profile creation on signup
- Subscription status tracking

### Dashboard
- Modern, responsive design
- Tool categorization and organization
- Quick access to popular tools
- User statistics and insights

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend and authentication
- **Lemon Squeezy** - Payment processing
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Development

### Code Quality

The project uses ESLint and TypeScript for code quality:

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Database Schema

The database schema includes:
- User profiles linked to Supabase Auth
- Subscription data from Lemon Squeezy
- Row Level Security (RLS) policies
- Proper indexing for performance

## Deployment

The application is ready for deployment on Vercel, Netlify, or any other Next.js-compatible platform. Make sure to:

1. Set all environment variables
2. Run the database schema migration
3. Configure Lemon Squeezy webhooks to point to your production URL

## Support

For issues or questions, please check the documentation or create an issue in the repository.
