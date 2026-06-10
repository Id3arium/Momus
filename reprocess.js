#!/usr/bin/env node

/**
 * Reprocesses existing review JSON files to add new analysis fields
 * (wordCount, fiveStarClustering, oneStarClustering, localGuideAnalysis)
 * without needing to re-scrape
 *
 * Usage: node reprocess.js [directory]
 * Default directory: ./reviews
 */

const fs = require('fs');
const path = require('path');

// --- Helper functions (same as content.js) ---

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function standardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function coefficientOfVariation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  return standardDeviation(values) / mean;
}

function isRecentDate(dateStr) {
  if (!dateStr) return false;
  const lower = dateStr.toLowerCase();
  if (/\d+\s*(day|week|month)s?\s*ago/.test(lower)) {
    const monthMatch = lower.match(/(\d+)\s*months?\s*ago/);
    if (monthMatch && parseInt(monthMatch[1]) >= 12) {
      return false;
    }
    return true;
  }
  if (/^a\s+(day|week|month)\s+ago$/.test(lower)) {
    return true;
  }
  return false;
}

function calculateRatingClustering(reviews, targetRating) {
  const targetReviews = reviews.filter(r => r.rating === targetRating);

  if (targetReviews.length < 3) {
    return { cv: 0, totalCount: targetReviews.length, dateCount: 0 };
  }

  const byDate = {};
  targetReviews.forEach(r => {
    const date = r.date || 'unknown';
    byDate[date] = (byDate[date] || 0) + 1;
  });

  const counts = Object.values(byDate);
  const cv = coefficientOfVariation(counts);

  return {
    cv: +cv.toFixed(2),
    totalCount: targetReviews.length,
    dateCount: counts.length
  };
}

function calculateWordCountByRating(reviews) {
  const wordCountByRating = {};
  const ratingsPresent = [...new Set(reviews.map(r => r.rating))];

  ratingsPresent.forEach(stars => {
    const ratingReviews = reviews.filter(r => r.rating === stars);
    if (ratingReviews.length > 0) {
      const totalWords = ratingReviews.reduce((sum, r) => sum + countWords(r.text), 0);
      wordCountByRating[stars] = +(totalWords / ratingReviews.length).toFixed(1);
    }
  });

  return wordCountByRating;
}

function calculateAvgWordCount(reviews) {
  if (reviews.length === 0) return 0;
  return +(reviews.reduce((sum, r) => sum + countWords(r.text), 0) / reviews.length).toFixed(1);
}

function calculateLocalGuideAnalysis(reviews) {
  const localGuideReviews = reviews.filter(r => r.isLocalGuide);
  const nonLocalGuideReviews = reviews.filter(r => !r.isLocalGuide);

  const localGuideAvg = localGuideReviews.length > 0
    ? +(localGuideReviews.reduce((sum, r) => sum + r.rating, 0) / localGuideReviews.length).toFixed(2)
    : 0;

  const nonLocalGuideAvg = nonLocalGuideReviews.length > 0
    ? +(nonLocalGuideReviews.reduce((sum, r) => sum + r.rating, 0) / nonLocalGuideReviews.length).toFixed(2)
    : 0;

  const difference = localGuideAvg > 0 && nonLocalGuideAvg > 0
    ? +(nonLocalGuideAvg - localGuideAvg).toFixed(2)
    : 0;

  return {
    localGuideCount: localGuideReviews.length,
    localGuideAvgRating: localGuideAvg,
    nonLocalGuideCount: nonLocalGuideReviews.length,
    nonLocalGuideAvgRating: nonLocalGuideAvg,
    difference: difference
  };
}

// --- Main reprocessing logic ---

function reprocessFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Check if reviews exist
  if (!data.reviews || !Array.isArray(data.reviews)) {
    console.log(`  Skipping ${path.basename(filePath)}: no reviews array`);
    return false;
  }

  const reviews = data.reviews;
  let updated = false;

  // Add fiveStarClustering if missing
  if (!data.analysis.fiveStarClustering) {
    const recentReviews = reviews.filter(r => isRecentDate(r.date));
    data.analysis.fiveStarClustering = {
      recent: calculateRatingClustering(recentReviews, 5),
      allTime: calculateRatingClustering(reviews, 5)
    };
    updated = true;
  }

  // Add oneStarClustering if missing
  if (!data.analysis.oneStarClustering) {
    const recentReviews = reviews.filter(r => isRecentDate(r.date));
    data.analysis.oneStarClustering = {
      recent: calculateRatingClustering(recentReviews, 1),
      allTime: calculateRatingClustering(reviews, 1)
    };
    updated = true;
  }

  // Add word count metrics to each analysis section
  ['all', 'middle', 'extreme'].forEach(section => {
    if (data.analysis[section] && !data.analysis[section].avgWordCount) {
      let sectionReviews;
      if (section === 'all') {
        sectionReviews = reviews;
      } else if (section === 'middle') {
        sectionReviews = reviews.filter(r => r.rating >= 2 && r.rating <= 4);
      } else {
        sectionReviews = reviews.filter(r => r.rating === 1 || r.rating === 5);
      }

      data.analysis[section].avgWordCount = calculateAvgWordCount(sectionReviews);
      data.analysis[section].wordCountByRating = calculateWordCountByRating(sectionReviews);
      updated = true;
    }
  });

  // Convert old suspicionScore to extremeReviewPct if needed
  if (data.analysis.suspicionScore !== undefined && data.analysis.extremeReviewPct === undefined) {
    data.analysis.extremeReviewPct = data.analysis.suspicionScore;
    delete data.analysis.suspicionScore;
    updated = true;
  }

  // Add localGuideAnalysis if missing
  if (!data.analysis.localGuideAnalysis) {
    data.analysis.localGuideAnalysis = calculateLocalGuideAnalysis(reviews);
    updated = true;
  }

  if (updated) {
    // Add reprocessed timestamp
    data.reprocessedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  }

  return false;
}

function main() {
  const inputDir = process.argv[2] || './reviews';

  if (!fs.existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.json') && f !== 'rankings.csv')
    .map(f => path.join(inputDir, f));

  if (files.length === 0) {
    console.log('No JSON files found to reprocess');
    process.exit(0);
  }

  console.log(`Found ${files.length} JSON files in ${inputDir}\n`);

  let updatedCount = 0;
  let errorCount = 0;

  files.forEach(filePath => {
    const filename = path.basename(filePath);
    try {
      const wasUpdated = reprocessFile(filePath);
      if (wasUpdated) {
        console.log(`  Updated: ${filename}`);
        updatedCount++;
      } else {
        console.log(`  Skipped (already up to date): ${filename}`);
      }
    } catch (err) {
      console.error(`  Error processing ${filename}: ${err.message}`);
      errorCount++;
    }
  });

  console.log(`\nDone! Updated ${updatedCount} files, ${errorCount} errors`);
}

main();
