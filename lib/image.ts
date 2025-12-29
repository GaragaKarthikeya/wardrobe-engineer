/**
 * Image utilities for standardization and conversion
 */

/**
 * Converts any image to JPEG format using Canvas API
 * Supports: JPEG, PNG, WEBP, GIF, BMP, HEIC (via browser support)
 * @param file - Input file
 * @param quality - JPEG quality (0-1), default 0.85
 * @returns Promise<Blob> - JPEG blob
 */
export async function convertToJpeg(file: File, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');

            // Limit max dimensions to 1600px for storage efficiency
            const maxDim = 1600;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }

            // Draw image with white background (for transparency)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        // Create object URL for the file
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Supported image formats
 */
export const SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/heic',
    'image/heif',
].join(',');
