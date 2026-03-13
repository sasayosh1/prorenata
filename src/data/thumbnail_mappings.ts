/**
 * Thumbnail Mappings
 * 
 * Maps article slugs to shared thumbnail filenames in `/blog_thumbnails/`.
 * This allows multiple articles to share the same high-quality illustration
 * without duplicating physical files.
 */
export const THUMBNAIL_MAPPINGS: Record<string, string> = {
  // Group: Interview Prep (MD5: 7cf8d073ca14271d0b387fe20c71854f)
  'nursing-assistant-interview-answers-examples': 'nursing-assistant-interview-prep.png',
  'nursing-assistant-interview-tips-compass': 'nursing-assistant-interview-prep.png',
  'nursing-assistant-interview-tips-motivation': 'nursing-assistant-interview-prep.png',

  // Group: Career Change / Job Manual (MD5: 93d4a125384fcdb4951c2a66362f7c62)
  'nursing-assistant-job-change-manual': 'nursing-assistant-career-change-support.png',

  // Group: Career Path / Job Manual (MD5: b6f075424b8263ea5f3c31c90aa3fa4a)
  'nursing-assistant-job-manual-v22': 'nursing-assistant-become-nurse-guide.png',

  // Group: Resignation / How to Quit (MD5: 4b7a995fe3308afd85bf67f18bf070ba)
  'nursing-assistant-quit-retirement': 'nursing-assistant-how-to-quits.png',

  // Group: Salary / Care Guide Approach (MD5: ed6055683eb39ff0f0751f9f2002dfae)
  'nursing-assistant-salary-v21': 'nursing-assistant-care-guide-approach.png',
};
