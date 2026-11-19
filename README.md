# Finding My Way to Jesus Christ

A personal Bible website: the **World English Bible, Catholic Edition** (all 73 books), a reading history and a journal. Sign in with Google, and your data syncs across all your devices.

**What it does**
- **Read** chapter by chapter, **verse by verse** (arrow keys or swipe), or get a **random verse** from the whole Bible, either Testament, the Gospels, the Psalms and Wisdom books, the Prophets, the Letters, or a single book.
- **Tap verses** to bookmark them, highlight them in four colours, write a note on a verse or a range, or copy them.
- **Search by meaning:** describe what's on your heart in your own words ("love towards my wife", "feeling not good enough"), optionally only within Corinthians or any other book or chapter, and it finds passages that *mean* that, even when they use different words. It runs entirely on your device: it's free, private, and works offline after a one-time download.
- **Expand:** any verse in search results, random verse or verse-by-verse view can grow into its surrounding passage, a few verses at a time.
- **Topics:** pick a feeling (anger, love, fear, worry, grief, loneliness, joy, hope, peace, forgiveness, guilt, jealousy, pride, patience, gratitude, temptation, doubt, tiredness) or search for any word. Narrow it to the Old Testament, the New Testament, both, one book, or one chapter. Each topic shows hand-picked key verses first, then every verse that mentions it. The topics where "towards whom" matters have **sub-topics**: Love → husband, wife & partner / family / friends / neighbour / enemies / God's love for you / loving God; Doubt → self-doubt / doubting God / learning to trust; plus Anger, Fear, Grief, Forgiveness and Worry. Each sub-topic has hand-picked verses, followed by more passages found by meaning.
- **Welcome and sign-in:** a new visitor chooses Continue with Google, Continue with email (Supabase emails a link and a 6-digit code; the code works on any device), or Continue without an account (everything stays on that device). Email needs custom SMTP in Supabase (e.g. Resend with your own domain) and the email templates to include `{{ .Token }}`.
- **Story search:** type a famous story's name in Topics search, even misspelled ("wale story", "red see", "goliat"), and a card for it appears on top. About 90 stories in `site/js/stories.js`.
- **Your goals:** three rings on Today: chapters today, days this week, and your journey (whole Bible, a Testament, the Gospels or the Psalms). Tap Change to set them.
- **Verse for today:** from what you're reading, a book you choose (in order or surprise), or anywhere. Verses are picked from a list chosen ahead of time by meaning (promises, prayers, comfort, wisdom, words of Jesus), so lines like "Legion" or "what fell among the thorns" don't come up on their own. In order mode, a story shows as a scene: its title, key verse and one question to think about. To rebuild the list: `node tools/build_daily.mjs` (usage at the top of the file). Goals, this choice and the verses already shown sync across devices in one notes row of kind `settings`.
- **Motion:** shake for a treasure; tilt for gentle depth in the blessing and the fight scene. iPhones need You → Settings → Motion → Allow motion.
- **"Let Him fight for you":** in Topics, a heavy feeling (Fear, Worry, Grief, Loneliness, Guilt, Tiredness and others) shows this button. A short sheet asks what's weighing on you (up to 5 words or phrases, kept on the device). Then double doors open, Jesus stands in the light, and each dark word is met by a beam from His heart, breaks into dust, and re-forms as its answer (fear → peace, "my exam" → "I will give you wisdom"). Your words come last. Afterwards you get a verse to think about and can **Save as a prayer**; saved prayers appear in the Journal and in the weekly review under **Given to Him**, which asks "How did it go?". Answers come from a hand-written list matched by keywords, and by meaning when meaning search is downloaded. Words about ending one's life get a gentle answer and a helpline (Tele-MANAS 14416, India). Prayers sync as notes of kind `prayer` with details stored as JSON in `body`, so no database change is needed.
- **Weekly badges:** reach your weekly goal and a medallion named for that week of the Church year ("33rd Week in Ordinary Time", "2nd Week of Advent") drops in, coloured for the season. It plays once, the moment it's earned, and syncs so other devices don't repeat it.
- **Monthly scenes and the Tree of Life:** read every day of a month (3 grace days allowed) for a new scene: a seed, the mustard tree, the vine, the lamp, living water, a city on a hill, rest, eagles' wings, the harvest, the gates, the race, and the Tree of Life. Missing a month never resets anything. A second year plays in gold. **You → Your journey** shows this year's badges and your tree, and replays any scene.
- **Hidden treasures:** 46 small surprises. Some are hidden in verses (tap them), some in gestures, some come with Church seasons and hours, and some are milestones. Each one can be shared as an image card. The **You** page shows how many each chapter holds, and hints unlock once you've finished reading that chapter.
- **The blessing:** after 5+ minutes of reading, pressing back from a passage shows a short animation ending with "Jesus loves you, my child."
- **Optional AI:** "Explain", "Help me reflect", and "Ask about these passages" buttons, using your own Claude API key. It's off until you turn it on (see below).
- **History:** a day-by-day view of each week (what you read and the notes you wrote), a **weekly reflection**, a 26-week activity map, your streak, and progress through every book.
- **Journal:** all your notes, weekly reflections and saved verses, with search.
- **Today:** a verse for the day, "continue where you left off", your week at a glance, and an older note to revisit.
- **Install:** an Install button in the top bar and on the You page. On Android, Chrome and Edge it opens the browser's install prompt; on iPhone and iPad it shows the two steps (Share → Add to Home Screen). It hides once the app is installed.
- It works offline once installed (add it to your home screen), saves everything on the device first, and syncs in the background when you're signed in.

```
finding-my-way/
├── site/                 ← this folder is the website (static files)
│   ├── index.html, css/, js/, data/ (Bible text as JSON), vendor/ (supabase-js)
│   └── js/config.js      ← put your Supabase URL + key here
├── worker/index.js       ← Cloudflare Worker: serves site/, and /api/ai for the optional AI
├── wrangler.jsonc        ← Worker settings
├── functions/api/ai.js   ← the AI code the Worker calls
├── supabase/schema.sql   ← run once in Supabase to create the tables
└── tools/                ← scripts that generated site/data (only needed to rebuild)
```

---

## 1. Try it on your computer (2 minutes)

```bash
cd site
python3 -m http.server 8080
```
Open http://localhost:8080. Everything works without an account; your data is saved in the browser.

## 2. Create the database (Supabase, about 5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free project. Pick a region close to you (Mumbai is `ap-south-1`).
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
   This creates three tables (`reading_log`, `notes`, `bookmarks`), each locked down so an account can only ever read and write its own rows.
3. Open **Project Settings → API** (on newer dashboards, **API Keys**) and copy:
   - the **Project URL**, like `https://abcdefgh.supabase.co`
   - the **anon / publishable key**

## 3. Turn on "Sign in with Google" (about 10 minutes)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (any name).
2. **APIs & Services → OAuth consent screen:** choose *External*, fill in the app name and your email, and save. While the app is in *Testing*, add your own Gmail address under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Application type: **Web application**
   - **Authorized redirect URIs:** `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (Supabase shows this exact URL on the Google provider page.)
   - Copy the **Client ID** and **Client secret**.
4. In Supabase, go to **Authentication → Sign In / Providers → Google**, turn it on, and paste the Client ID and secret.
5. In Supabase, go to **Authentication → URL Configuration**:
   - **Site URL:** `https://<your-name>.pages.dev`
   - **Redirect URLs:** add `https://<your-name>.pages.dev/**` and, for local testing, `http://localhost:8080/**`

## 4. Connect the site to Supabase

Edit `site/js/config.js`:

```js
export const SUPABASE_URL = "https://abcdefgh.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";   // or sb_publishable_...
```

The anon (publishable) key is meant to be public, so it's fine to have it in your site. Row Level Security is what protects your data.

## 5. Deploy to Cloudflare (Workers)

The site runs as a Cloudflare Worker with static assets (`wrangler.jsonc`). The Worker serves everything in `site/` and only runs code for `/api/*`.

**Through GitHub (redeploys on every push):** Cloudflare → **Workers & Pages → Create → Import a repository**, pick the repository, and use:
- Build command: *(leave empty)*
- Deploy command: **`npx wrangler deploy`**

**Or from a terminal:** `npx wrangler deploy`

Open your `https://<name>.<you>.workers.dev` URL (or your own domain), go to **You → Sign in with Google**, and do the same on your phone and other devices.

**Keep it to just you (recommended):** after you've signed in once, go to Supabase → **Authentication → Sign In / Providers** (or **Auth settings**) and turn off **Allow new users to sign up**. Anyone else who finds the URL can still read the Bible, but they can't create an account on your database.

The site already tells search engines not to index it (`robots.txt`, a `noindex` meta tag, and an `X-Robots-Tag` header in `_headers`).

---

## Search by meaning: how it works

- `site/data/semantic/` holds a pre-computed index of about 17,000 short passages (3 verses each, overlapping) and a small open-source model: **all-MiniLM-L6-v2** (Apache-2.0 licence, by the Sentence-Transformers authors), running through ONNX Runtime Web (MIT licence, Microsoft).
- The first time you search by meaning, the app downloads about 43 MB (the model, the passage index and the ONNX runtime), then keeps it for offline use. After that, a search takes well under a second.
- Results are ranked by meaning, with a small bonus when your exact words appear. The app also suggests a matching sub-topic, so "love towards my wife" offers *Love › Husband, wife & partner*.
- When a question clearly matches one of the curated topics (for example "feeling not good enough" → *Self-doubt*), its hand-picked verses appear first, with the meaning-based results below.
- It's good at feelings and themes. It isn't a question-answering engine: "who was King David's father?" finds passages *about* David, not the answer. That's what the optional AI is for.
- To rebuild the index after editing sub-topics, run `node tools/build_semantic.mjs …` (the usage line is at the top of that file). Then bump `DATA` in `site/sw.js` so installed copies download the new index.

## Optional: AI explanations

This adds **Explain**, **Help me reflect**, and **Ask about these passages**. It uses Claude through your own API key, which stays on Cloudflare and never goes to the browser. Only you can use it: the server checks your Google sign-in against an allowed email.

**What it costs:** each request sends one passage (or the top 8 search results) plus your question, and gets back a short answer. That's roughly 1,000–3,000 tokens per request. At 10 requests a day, that's under a million tokens a month. On a small model like Claude Haiku that's typically a few dollars at most; check current prices at anthropic.com/pricing. The **You** page shows how many tokens you've used this month, and the server enforces a monthly cap (600 requests by default).

1. Get an API key at [console.anthropic.com](https://console.anthropic.com) and add a small amount of credit.
2. Run the updated `supabase/schema.sql` again in the Supabase SQL Editor. This adds the usage counter, and running it again is safe.
3. The Worker already routes `/api/ai` to this code; nothing else to deploy.
4. In Cloudflare → your Worker → **Settings → Variables and Secrets**, add:
   - `ANTHROPIC_API_KEY`: your key (type **Secret**)
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`: the same values as in `config.js`
   - `ALLOWED_EMAILS`: your Google email
   - optional: `ANTHROPIC_MODEL` (default `claude-haiku-5-5`) and `MONTHLY_LIMIT` (default `600`)
5. Set `AI_ENABLED = true` in `site/js/config.js`, then push (or deploy again).

## How sync works

- Every change is saved on the device immediately, so the app is fast and works offline.
- When you're signed in, changes are pushed to Supabase within a couple of seconds. The app also pulls changes from your other devices when it opens, when you switch back to the tab, and every minute while it's open.
- If the same item is edited on two devices, the newest edit wins. Deleting an item deletes it everywhere.
- Anything you did before signing in on a device is uploaded to your account the first time you sign in there.
- **Your data → Export** (on the **You** page) downloads everything as JSON, and **Import** loads it back.
- Free Supabase projects pause after about a week with no activity. If that happens, the app keeps working on the device. Click **Restore** in the Supabase dashboard and it will catch up.

## About the text

The **World English Bible** is in the public domain (eBible.org); "World English Bible" is a trademark of eBible.org. This app uses the Catholic arrangement:
- 73 books in Catholic order, with the divine name shown as "the LORD"
- Greek Esther
- Daniel 3:24–90 (the Prayer of Azariah and Song of the Three), Daniel 13 (Susanna) and Daniel 14 (Bel and the Dragon)
- the Letter of Jeremiah as Baruch 6

The text was assembled from eBible's public-domain *WEB Updated* text (the wording the Catholic edition uses), with paragraph and poetry layout taken from the WEB source files. About 260 verses (mostly at chapter boundaries) and the Greek additions to Daniel and Baruch weren't available in the updated text, so they use the classic WEB wording with "LORD" substituted. Verse numbering inside Daniel 3:24–90 may be off by one around verse 56 compared with printed Catholic Bibles. To rebuild the data, see `tools/build_data.py`.

## Changing things later

- **Colours and fonts:** the variables at the top of `site/css/app.css`.
- **Random-verse scopes:** `SCOPES` in `site/js/bible.js`.
- **Topics:** `site/js/topics.js`. Each topic has a name, a short description, the words to search for, and a list of key verses (`"PSA 23:4"` or `"EPH 4:26-27"`, using three-letter book codes such as `GEN`, `PSA`, `MAT`, `JHN`, `1CO`). Add your own topics or verses there.
- **Adding another translation later:** add a second `data/` folder in the same JSON format. Notes and history are stored by book, chapter and verse, so they stay attached when you switch translations.
- **After changing files:** bump `VERSION` in `site/sw.js` so installed copies pick up the update.
