/**
 * Converts a standard Google Drive sharing link to a direct image URL.
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://link.to.image.com/direct.jpg (returns as is)
 */
export const getDirectDriveUrl = (url) => {
    if (!url) return '';

    // Check if it's a Google Drive link
    const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)\/|id=([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegex);

    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const fileId = match[1] || match[2];
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // Return original URL if not a Drive link
    return url;
};
