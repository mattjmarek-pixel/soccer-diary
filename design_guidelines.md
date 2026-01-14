# Soccer Diary — Design Guidelines

## Brand Identity

**Purpose**: A habit-forming training journal for soccer players to track daily progress, record skills, and build consistent improvement routines.

**Aesthetic Direction**: Athletic Bold
- High-energy, motivating, field-inspired
- Stadium lighting contrast (bright on dark)
- Crisp, performance-focused (like sports tech)
- Memorable element: Vibrant pitch-green accents against deep charcoal, evoking the field under stadium lights

**Differentiation**: The timeline feels like scrolling through match highlights—every entry is a small victory. This isn't a passive log; it's a hype reel of your training journey.

## Navigation Architecture

**Root Navigation**: Bottom Tab Bar (3 tabs)
- **Timeline** (Home) - Chronological feed of all diary entries
- **New Entry** (Center, elevated FAB) - Create diary entry
- **Profile** - User stats, settings, upgrade to premium

**Authentication**: Required
- Use Apple Sign-In (iOS) + Google Sign-In (Android)
- Onboarding: 3-screen swipeable intro → sign-up/login
- Profile includes logout (with confirmation) and delete account (nested under Settings > Account > Delete)

## Screen-by-Screen Specifications

### 1. Onboarding (Stack-Only Flow)
**Screens**: 3 swipeable cards → Auth screen
- **Onboarding Cards**: Full-screen illustrations with headline + subtext
  - Card 1: "Track Every Session" (illustration: player with ball)
  - Card 2: "Watch Your Progress" (illustration: upward graph with soccer ball)
  - Card 3: "Build Your Legacy" (illustration: trophy)
- **Auth Screen**: 
  - Logo at top
  - "Sign in with Apple" button
  - "Sign in with Google" button
  - Links to Privacy Policy & Terms (bottom)

### 2. Timeline (Home Tab)
**Layout**:
- Header: Transparent, title "Timeline", right button: Filter icon
- Main: Scrollable list of diary entry cards
- Safe area: top = headerHeight + 24px, bottom = tabBarHeight + 24px

**Entry Card**:
- Date (large, bold)
- Mood indicator (5 colored dots, filled based on rating)
- Text preview (2 lines, truncated)
- Skill tags (chips: "Dribbling", "Shooting", etc.)
- Video thumbnail (if attached, plays inline on tap)
- Tap card → navigates to Diary Detail

**Empty State**: Illustration (empty-timeline.png) with "Start your journey" CTA

### 3. New Entry (Modal Screen via FAB)
**Layout**:
- Header: "New Entry", left: Cancel, right: Save
- Main: Scrollable form
- Safe area: top = 24px, bottom = insets.bottom + 24px

**Form Fields** (top to bottom):
1. Date picker (default: today)
2. Mood slider (1-5, with emoji indicators)
3. Training duration (number input, minutes)
4. Text area: "How did training go?" (multiline)
5. Skill checkboxes with notes:
   - Dribbling, Shooting, Passing, First Touch, Fitness, Tactics
   - Each has collapsible notes field
6. Video section:
   - "Add Video" button
   - If video added, show thumbnail with remove icon
7. Submit button below form (full-width, bold)

### 4. Diary Detail (Pushed from Timeline)
**Layout**:
- Header: Default navigation, title: Date, right: Edit icon
- Main: Scrollable content
- Safe area: top = 24px, bottom = insets.bottom + 24px

**Content**:
- Mood + duration at top
- Full text entry
- Skills worked on (cards with notes)
- Video player (if attached, full-width, 16:9 aspect)

### 5. Profile Tab
**Layout**:
- Header: Transparent, title "Profile"
- Main: Scrollable
- Safe area: top = headerHeight + 24px, bottom = tabBarHeight + 24px

**Sections**:
1. Avatar + Name (editable via Edit Profile button)
2. Stats cards: Total Entries, Training Hours, Current Streak
3. "Upgrade to Premium" card (if free user)
4. List: Edit Profile, Settings, Help, Logout

### 6. Edit Profile (Modal)
**Layout**:
- Header: "Edit Profile", left: Cancel, right: Save
- Main: Scrollable form with avatar picker, name, age, team, position, preferred foot
- Safe area: top = 24px, bottom = insets.bottom + 24px

### 7. Filter Modal (from Timeline)
**Layout**:
- Header: "Filter Entries", left: Cancel, right: Apply
- Main: Form with date range picker, skill multi-select, search bar
- Safe area: top = 24px, bottom = insets.bottom + 24px

## Color Palette

**Primary**: `#00E676` (Electric Pitch Green) - CTAs, active states, progress
**Background**: `#121212` (Deep Charcoal) - Main background
**Surface**: `#1E1E1E` (Elevated Charcoal) - Cards, modals
**Text**: `#FFFFFF` (Pure White) - Primary text
**Text Secondary**: `#B0B0B0` (Soft Gray) - Metadata, captions
**Accent**: `#FFD600` (Stadium Yellow) - Highlights, streaks
**Error**: `#FF5252` (Bright Red)
**Success**: `#00E676` (same as primary)

## Typography

**Font**: Montserrat (Google Font) for bold, athletic character
- **Display**: Montserrat Bold, 28px - Screen titles
- **Heading**: Montserrat SemiBold, 20px - Card titles, section headers
- **Body**: System sans-serif Regular, 16px - Entry text, descriptions
- **Caption**: System sans-serif Regular, 14px - Metadata, timestamps
- **Button**: Montserrat SemiBold, 16px - All CTAs

## Visual Design

**Touchable Feedback**: 
- Cards: scale down to 0.98 on press, subtle opacity change
- Buttons: background darkens 10% on press
- FAB: drop shadow (offset: 0/2, opacity: 0.10, radius: 2)

**Icons**: Feather icons from @expo/vector-icons (white or primary green)

**Cards**: 
- Background: Surface color
- Border radius: 12px
- No shadow (flat, modern)
- 16px padding

## Assets to Generate

1. **icon.png** - App icon: Soccer ball with electric green glow on dark background - USED: Device home screen
2. **splash-icon.png** - Simplified icon for splash screen - USED: App launch
3. **empty-timeline.png** - Illustration: Soccer player on empty field looking at horizon - USED: Timeline empty state
4. **onboarding-track.png** - Player dribbling with motion trails - USED: Onboarding screen 1
5. **onboarding-progress.png** - Upward trending graph with soccer ball at peak - USED: Onboarding screen 2
6. **onboarding-legacy.png** - Trophy with subtle green glow - USED: Onboarding screen 3
7. **avatar-placeholder.png** - Silhouette of player in action pose - USED: Default user avatar

**Asset Style**: Minimalist, single-color illustrations (white on transparent) with optional green accent. Clean lines, not clipart. Athletic and energetic.