# Beeps Mobile

The mobile companion app for [Beeps](https://github.com/tgoky/beeps) - a comprehensive music production marketplace connecting artists, producers, studios, and gear sellers.

## Features

- **Multi-role Authentication**: Sign up as an Artist, Producer, Studio Owner, Gear Seller, or Lyricist
- **Marketplace**: Browse and purchase beats, book studio time, and rent/buy equipment
- **Collaborations**: Find and create collaboration opportunities with other creators
- **Community**: Connect with other creators through role-based community feeds
- **User Profiles**: Manage your profile, view stats, and showcase your work

## Tech Stack

- **Framework**: [Expo](https://expo.dev) with [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language**: TypeScript
- **Backend**: [Supabase](https://supabase.com) (authentication & database)
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form
- **Audio**: Expo AV
- **UI**: React Native with custom components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio for testing

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   Copy `.env.example` to `.env` and add your Supabase credentials:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Project Structure

```
beeps-mobile/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   └── ui/shared/         # Shared components (Button, Card, Input, etc.)
├── contexts/              # React contexts (Auth, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Libraries and utilities
│   └── supabase.ts        # Supabase client configuration
├── providers/             # App-level providers
├── types/                 # TypeScript type definitions
└── constants/             # App constants and theme
```

## Key Screens

### Authentication
- **Login**: Sign in to existing account
- **Register**: Create new account with role selection
- **Forgot Password**: Reset password flow

### Main Tabs
- **Home**: Dashboard with quick actions and recent activity
- **Marketplace**: Browse beats, studios, and equipment
- **Collaborations**: Find and create collaboration opportunities
- **Community**: Role-based social feed
- **Profile**: User profile and settings

## Development

This project uses [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing. Add new screens by creating files in the `app` directory.

### Adding New Features

1. Create screen files in `app/` directory
2. Add types to `types/database.ts`
3. Create API hooks using React Query
4. Build UI components in `components/`

## Database Schema

The app uses the same Prisma schema as the [web version](https://github.com/tgoky/beeps), including:
- Users with multiple role profiles
- Beats, Studios, Equipment marketplace
- Collaborations and Service Requests
- Community posts and social features
- Bookings and Transactions

## Related Projects

- [Beeps Web](https://github.com/tgoky/beeps) - Next.js web application

## License

Private
