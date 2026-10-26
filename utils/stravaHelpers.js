const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Format an activity start date in the correct local timezone.
 *
 * @param {Object} activity - Strava activity object
 * @returns {string} Formatted date like "Saturday, September 13, 2025 at 09:52AM"
 */
function formatActivityDate(activity) {
  if (!activity.start_date) return "Unknown date";

  // Extract timezone from activity (e.g. "(GMT-04:00) America/New_York")
  let tz = "UTC";
  if (activity.timezone) {
    const match = activity.timezone.match(/ ([A-Za-z_]+\/[A-Za-z_]+)/);
    if (match) tz = match[1];
  }

  return dayjs.utc(activity.start_date)
    .tz(tz)
    .format("dddd, MMMM D, YYYY [at] hh:mmA");
}

function metersToMiles(meters) {
  return meters / 1609.34;
}

function secondsToMinutes(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, "0")}m${secs.toString().padStart(2, "0")}s`;
  } else {
    return `${minutes}m${secs.toString().padStart(2, "0")}s`;
  }
}

function paceFromSecondsPerMile(secondsPerMile) {
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} min/mi`;
}

// Example: calculate pace given distance (meters) and time (seconds)
function pace(distanceMeters, durationSeconds) {
  const miles = metersToMiles(distanceMeters);
  if (miles === 0) return "0:00 min/mi";
  const secondsPerMile = durationSeconds / miles;
  return paceFromSecondsPerMile(secondsPerMile);
}

// Format meters for display, e.g. 5000 -> "5,000 m"
function metersToFormatted(meters) {
  return `${Math.round(meters).toLocaleString("en-US")} m`;
}

// Rowing split: time per 500m formatted as m:ss.t, e.g. "2:05.3 /500m"
function pacePer500m(distanceMeters, durationSeconds) {
  if (distanceMeters === 0) return "0:00.0 /500m";
  // Round to tenths first so 59.96s becomes 1:00.0 rather than 0:60.0
  const tenths = Math.round((durationSeconds / (distanceMeters / 500)) * 10);
  const minutes = Math.floor(tenths / 600);
  const seconds = ((tenths % 600) / 10).toFixed(1);
  return `${minutes}:${seconds.padStart(4, "0")} /500m`;
}

module.exports = {
  metersToMiles,
  metersToFormatted,
  secondsToMinutes,
  pace,
  pacePer500m,
  formatActivityDate
}