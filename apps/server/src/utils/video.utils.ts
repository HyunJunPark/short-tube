/**
 * Determine if a video is a YouTube Short
 * @param title Video title
 * @param duration Video duration (HH:MM:SS or MM:SS or N/A)
 * @returns true if the video is a short
 */
export function isVideoShort(title: string, duration: string): boolean {
  // Check if title contains #shorts
  if (title.includes('#shorts')) {
    return true;
  }

  // Check if duration is <= 60 seconds (YouTube Shorts max length)
  const parts = duration.split(':');

  if (parts.length === 3) {
    // HH:MM:SS format - not a short
    return false;
  }

  if (parts.length === 2) {
    // MM:SS format - calculate total seconds
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    const totalSeconds = minutes * 60 + seconds;
    return totalSeconds <= 60;
  }

  // N/A or unknown - treat as non-short
  return false;
}
