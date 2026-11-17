# Plans: saved for later

Ideas agreed but not built yet. Nothing here is in the app until it's moved to "Done".

## 1. Better "Verse for today" (A + B + C)
Problem: the filter only checks a verse is a whole sentence, so story lines like Luke 8:30 ("Legion") get picked.
- **A. Rank every verse by meaning, ahead of time.** Score all ~35,000 verses with the on-device meaning model for how much they read like a promise, prayer, comfort, wisdom or a teaching of Jesus. Pick only from the top part of each book. Ships as a small list; no extra download.
- **B. Simple rules on top.** Prefer words of Jesus, prayers, verses addressed to "you"; skip lines about demons, travel, names, numbers, "he went to…".
- **C. When it's a story, show the story.** In "In order" mode, show the scene instead: a title ("Jesus frees the man called Legion · Luke 8:26–39"), its key verse (8:35), and one question to think about.

## 2. Weekly badges
- Earned when the "This week" ring fills. **Still to decide:** your weekly goal (e.g. 5 days) or all 7 days. Suggested: your goal.
- Each badge is named for that week of the Church year ("2nd Week of Advent", "33rd Week in Ordinary Time") and coloured for the season.
- A year of 52 medallions under History or You; missed weeks stay as quiet empty circles, no streak shaming.
- **When it plays:** the moment your reading fills the ring (e.g. finishing your 5th day), once, on whichever device you're using. A synced "already shown" flag stops it repeating on other devices. Replay any time from the badges.
- A small "Week complete" card on Today, with Share. Syncs across devices.
- **Animation (mocked up):** the medallion drops in and spins to a stop, a glint of light crosses it, sparkles burst, and "Week complete · 33rd Week in Ordinary Time · 5 of 5 days" appears. Then it shrinks and flies into its place in the row of weeks, which gives a small pulse. About 5 seconds.

## 3. Monthly scenes and the Tree of Life
- **Rule:** read every day of a calendar month, with **3 grace days** (after the three days before He rose).
- **Missing a month never resets anything:** the next completed month brings the next scene, and the tree keeps every fruit.
- **When it plays:** when you finish reading on the last day of the month; if you didn't read that day but still made it with grace days, the first time you open the app in the new month. Once only, synced across devices. Your Tree of Life lives under You; any scene can be replayed.
- **Video mockup made** for months 1, 6 and 12 (`badges-and-months-mockup.mp4`); the prototype is `tests/proto/site/milestones.html` in Claude's workspace. Waiting for feedback before building.

| Month | Scene | Verse |
|---|---|---|
| 1 | A seed falls into the soil and sprouts | Mark 4:26–27 |
| 2 | The mustard seed grows into a small tree, and birds land | Matthew 13:31–32 |
| 3 | A vine spreads and bears its first grapes | John 15:5 |
| 4 | A lamp is lit and set on a stand, and the room fills with light | Matthew 5:15 |
| 5 | A well, with living water rising and overflowing | John 4:14 |
| 6 | A city on a hill lights up, window by window, at night | Matthew 5:14 |
| 7 | The sun sets over a calm sea as seven stars appear | Genesis 2:2 |
| 8 | An eagle rises through clouds into open sky | Isaiah 40:31 |
| 9 | A wheat field ripens in golden waves | John 4:35 |
| 10 | Great gates swing open to light | Psalm 24:7 |
| 11 | A runner nears the finish, with a crowd of witnesses | Hebrews 12:1 |
| 12 | The Tree of Life: a river flows, and all 12 fruits glow | Revelation 22:1–2 |

After 12, a second year in gold: the same journey, richer each time.

## 4. "Let Him fight for you": less repetitive answers
- **Split entries automatically:** "exams, financial problems" or "exams and money" becomes separate words, each with its own answer (still up to 5 in total).
- **3–4 answers for each kind of worry**, each with its own verse, picking one you haven't seen recently. For money, for example:
  - "I will provide" (Philippians 4:19)
  - "Your Father knows what you need" (Matthew 6:8)
  - "Seek first the Kingdom, and all this is added" (Matthew 6:33)
  - "I will never leave you" (Hebrews 13:5)
- The "verse to think about" then changes with the answer.

## 5. Small things
- **Home-screen icon:** the app only has `icon.svg`. iPhones don't use SVG for home-screen icons (they show a blurry screenshot instead), and some Android phones shrink it into a white circle. Add PNG icons: a 180×180 `apple-touch-icon`, 192 and 512 for the manifest, and a 512 "maskable" one with padding so it fills Android's round or rounded-square shapes.
- At tablet width the title wraps as "Iter ad Do / minum".
- After a cancelled or refused Google sign-in the address shows `?error=access_denied…`. Clear it and show a friendly message instead.
- Optional AI: was written for Cloudflare Pages; the site runs on Workers, so it needs a small change before it can be turned on.

## Setup still to do
- Once everyone has joined: turn off "Allow new users to sign up" in Supabase.

## Done
- Google sign-in, email sign-in with a 6-digit code (Resend + Supabase), the welcome screen, and findingmyway.live connected to the site.
