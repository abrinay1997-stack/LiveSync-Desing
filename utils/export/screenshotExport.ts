/**
 * Screenshot Export Utility
 *
 * Captures the Three.js canvas as a PNG image
 */

import type { WebGLRenderer } from 'three';

// Global reference to the Three.js renderer (set by Scene3D component)
let glRenderer: WebGLRenderer | null = null;

/**
 * Register the WebGL renderer for screenshot capture
 * Called from Scene3D component on mount
 */
export function registerRenderer(renderer: WebGLRenderer): void {
    glRenderer = renderer;
}

/**
 * Unregister the renderer (cleanup)
 */
export function unregisterRenderer(): void {
    glRenderer = null;
}

/**
 * Capture the current viewport as a PNG data URL
 */
export function captureScreenshot(): string | null {
    if (!glRenderer) {
        console.error('Screenshot failed: No renderer registered');
        return null;
    }

    try {
        // Force a render to ensure latest frame
        glRenderer.render(glRenderer.info.render as any, glRenderer.info.render as any);

        // Get the canvas data URL
        const dataURL = glRenderer.domElement.toDataURL('image/png');
        return dataURL;
    } catch (error) {
        console.error('Screenshot capture failed:', error);
        return null;
    }
}

/**
 * Download the current viewport as a PNG file
 */
export function downloadScreenshot(filename?: string): boolean {
    const dataURL = captureScreenshot();
    if (!dataURL) return false;

    const name = filename || `livesync-screenshot-${new Date().toISOString().slice(0, 10)}.png`;

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}

/**
 * Get screenshot as Blob for PDF embedding
 */
export async function getScreenshotBlob(): Promise<Blob | null> {
    const dataURL = captureScreenshot();
    if (!dataURL) return null;

    try {
        const response = await fetch(dataURL);
        return await response.blob();
    } catch (error) {
        console.error('Failed to convert screenshot to blob:', error);
        return null;
    }
}
