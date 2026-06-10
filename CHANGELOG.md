# Changelog

## v1.13.0 - Bulk Scraping

### New Features
✅ **Bulk scrape mode** - Scrape multiple locations unattended
  - Click "Bulk Scrape" button to show URL input
  - Paste multiple Google Maps URLs (one per line)
  - Extension navigates to each URL sequentially and scrapes it
  - Progress bar shows current location being scraped
  - All JSONs auto-download to your Downloads folder
  - Perfect for processing 5-15 apartments overnight

### How to Use
1. Collect Google Maps URLs for apartments you're researching
2. Click "Bulk Scrape" button in extension popup
3. Paste URLs into text area (one per line)
4. Click "Start Bulk Scrape"
5. Walk away - extension handles navigation and scraping automatically
6. Find all JSON files in Downloads folder when complete

### Technical Details
- Sequential processing (one apartment at a time)
- 3-second page load delay between navigations
- 1-second delay between scrapes
- 5-minute timeout per location
- Cancel button to stop mid-scrape
- Auto-disables during bulk operation

---

## v1.12.1 - Bugfix: Regex Error

### Bug Fixes
✅ **Fixed regex error in keyword correlation** - "Error: nothing to repeat"
  - Google keywords containing special regex characters (like `*`, `+`, `?`) were causing crashes
  - Added `escapeRegex()` helper to escape special characters before creating regex patterns
  - Added try-catch block to gracefully skip problematic keywords

---

## v1.12 - Google Keyword Correlation Analysis

### Analysis Enhancements
✅ **Google keyword correlation** - Analyzes if Google's highlighted keywords hide problems
  - For each Google keyword, checks if reviews mentioning it have low ratings (≤3★)
  - Identifies red flags that appear alongside Google keywords
  - Shows warning when Google keywords correlate with negative reviews
  - Example: "maintenance" keyword → 65% of reviews are ≤3★, mentions: noise(12), broken(8)

### UI Improvements
✅ **Google Keywords Analysis section** - New panel shows concerning keyword patterns
  - Only displays keywords where >30% of mentions are low-rated or contain red flags
  - Shows percentage of ≤3★ reviews, average rating, and top red flags
  - Helps identify when Google is highlighting keywords that mask real problems

### Data Structure
- `analysis.googleKeywordCorrelation` - Per-keyword breakdown:
  - `reviewCount` - How many reviews mention this keyword
  - `avgRating` - Average rating of reviews mentioning this keyword
  - `lowRatingCount` / `lowRatingPct` - Count/percentage of ≤3★ reviews
  - `withRedFlagsCount` / `redFlagPct` - Count/percentage mentioning red flags
  - `topRedFlags` - Most common red flags appearing with this keyword

---

## v1.11 - Better Status Updates

### UX Improvements
✅ **Analysis status message** - Shows "Analyzing X reviews..." after scrolling completes
  - Previously jumped from "Loaded X reviews..." directly to "Scraping complete!"
  - Now provides feedback during the data analysis phase (spell checking, clustering, enrichment)
  - Better transparency into what the extension is doing

---

## v1.10 - Compact UI & Complete Clustering

### UI Improvements
✅ **Narrowed popup width** - Reduced from 420px to 350px for cleaner, more compact interface
✅ **Reformatted star distribution** - Count displayed on top, percentage below (easier to scan)
✅ **Added all star clustering metrics** - Now shows 2★, 3★, 4★ clustering alongside 1★ and 5★

### Data Improvements
✅ **Smarter filename generation** - Extracts location name from URL instead of scraped name
  - Example: `/maps/place/The+Apartments/` → `gmaps_the_apartments.json`
  - Falls back to scraped name if URL parsing fails
✅ **Removed timestamp from filename** - Old scans automatically overwritten by new ones
  - Before: `gmaps_location_2026-01-05_14-30-15.json`
  - After: `gmaps_location.json`

### Analysis Enhancements
✅ **Complete clustering analysis** - All 5 star ratings now tracked for temporal clustering
  - 5★, 4★, 3★, 2★, 1★ clustering (recent & all-time)
  - Helps identify suspicious patterns across all rating levels
  - Previously only tracked 5★ and 1★

---

## v1.9 - UI Redesign & Bug Fixes

### Bug Fixes
✅ **Fixed totalReviews count** - Now calculated from distribution sum instead of unreliable text parsing
  - Previously showed loaded count (34) instead of actual total (271)
  - Distribution sum is authoritative, text search validates
  - Warns in console if there's a mismatch (>5 reviews difference)

### UI Improvements
✅ **Redesigned popup layout** - Cleaner, more informative stats
  - Removed Local Guide comparison (rarely has data for apartments)
  - Added star distribution visualization (count + percentage)
  - Shows 1-star clustering metrics (recent & all-time) alongside 5-star
  - Reorganized stats: Avg Rating, Total Reviews, Middle Reviews, Extreme %
  - Widened popup from 350px to 420px for better readability

✅ **Live progress updates** - Shows review count during scrolling
  - Updates every 50 reviews: "Loaded 50 reviews...", "Loaded 100 reviews..."
  - Better feedback during long scrapes
  - Minimal code overhead (~10 lines)

### Updated Text Exports
- Copy Summary now includes star distribution percentages
- Removed Local Guide stats from text export
- Added 1-star clustering to summary output

---

## v1.5 - Three-Way Analysis Structure

### Features Added
✅ **Three-way analysis breakdown** - Always includes three separate analyses:
  - `analysis.all` - All reviews (1-5 stars)
  - `analysis.middle` - 2-4 star reviews (most trustworthy feedback)
  - `analysis.extreme` - 1 & 5 star reviews (potentially fake/biased)
✅ **Persistent state** - Popup remembers last scrape results even after closing (uses browser.storage)
✅ **Save As dialog** - Shows file picker to choose download location
✅ **Percentage breakdown** - Each analysis shows review count and percentage of total
✅ **Fixed keyword matching** - Red flags use word boundaries to prevent false positives (e.g., "ant" won't match "tenant", "important")
✅ **Average spelling errors** - Each analysis includes overall average spelling errors

### New JSON Structure
```json
{
  "summary": { "name": "...", "address": "...", "url": "...", "scrapedAt": "...", "scrapeOptions": {...} },
  "stats": { "averageRating": 4.5, "totalReviews": 223, "distribution": {...}, "googleKeywords": {...} },
  "analysis": {
    "suspicionScore": 0.89,
    "all": {
      "note": "Analysis of all reviews (1-5 stars)",
      "reviewCount": 223,
      "percentageOfTotal": 100.0,
      "avgSpellingErrors": 1.8,
      "spellingErrorsByRating": { "1": 2.5, "2": 1.8, "3": 1.5, "4": 1.2, "5": 2.1 },
      "redFlagSummary": { "noise": 12, "maintenance": 8 }
    },
    "middle": {
      "note": "Analysis of 2-4 star reviews (most trustworthy)",
      "reviewCount": 25,
      "percentageOfTotal": 11.2,
      "avgSpellingErrors": 1.5,
      "spellingErrorsByRating": { "2": 1.8, "3": 1.5, "4": 1.2 },
      "redFlagSummary": { "noise": 10, "thin walls": 5 }
    },
    "extreme": {
      "note": "Analysis of 1 & 5 star reviews (potentially fake)",
      "reviewCount": 198,
      "percentageOfTotal": 88.8,
      "avgSpellingErrors": 2.2,
      "spellingErrorsByRating": { "1": 2.5, "5": 2.1 },
      "redFlagSummary": { "noise": 2, "maintenance": 8 }
    }
  },
  "reviews": [ ... all reviews ... ]
}
```

### Key Comparisons to Make
- **Red flags in middle vs all**: If "noise" appears 12 times total but 10 are in 2-4 stars → real problem
- **Spelling errors**: Fake reviews often have more errors. Middle reviews should have fewer.
- **Volume**: High suspicion score (few middle reviews) suggests fake extremes

### Improvements
- Removed checkbox - all three analyses always included
- No duplicate review text in JSON output
- Word boundary regex for accurate red flag matching
- Clearer data structure for comparing review segments

---

## v1.4 - Auto-Download & Better File Structure

### Features Added
✅ **Auto-download after scraping** - File downloads automatically to your Downloads folder
✅ **Better JSON structure** - Analysis first, raw data at the bottom
✅ **Timestamp in filename** - No more overwriting files from the same location
✅ **Sorting options** - Most Relevant, Newest, Highest Rating, Lowest Rating
✅ **Review limit** - 100, 250, 500, 1000, or All

### New JSON Structure
```json
{
  "summary": {
    "name": "Location Name",
    "address": "Full Address",
    "url": "Google Maps URL",
    "scrapedAt": "2025-01-02T...",
    "scrapeOptions": { "sortOrder": "newest", "maxReviews": 500 }
  },
  "stats": { ... },
  "analysis": {
    "totalScraped": 223,
    "middleReviewCount": 25,
    "suspicionScore": 0.89,
    "spellingErrorsByRating": { ... },
    "redFlagSummary": { ... }
  },
  "reviews": [ ... ]
}
```

### Improvements
- Fixed selectors for Reviews tab button
- Fixed selectors for review parsing (using `div.jftiEf[data-review-id]`)
- Fixed selectors for sort dropdown
- Filename includes timestamp: `gmaps_location_2025-01-02_14-30-15.json`
- No more "Save As" dialog - goes straight to Downloads folder
- Popup state doesn't matter - file is auto-saved

### Known Issues
- Location name extraction may not work perfectly (Google changes DOM frequently)
- Sort functionality may need adjustment based on Google's UI updates

---

## v1.3 - Initial Release

- Basic scraping functionality
- Red flag keyword detection
- Spelling error analysis
- Suspicion score calculation
- Manual download option
