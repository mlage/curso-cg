// Expand each line segment into two triangles in CSS-pixel space.
// The fragment shader rounds the ends and smooths the edges of each stroke.
export function createCurveStroke(segments, bounds, width, height, lineWidth) {
    const { minX, maxX, minY, maxY } = bounds;
    const positions = [];
    const strokes = [];
    const halfWidth = lineWidth / 2;
    const padding = halfWidth + 1; // Leave room for the antialiased fringe.

    for (let i = 0; i < segments.length; i += 4) {
        const x1 = (segments[i] - minX) / (maxX - minX) * width;
        const y1 = (segments[i + 1] - minY) / (maxY - minY) * height;
        const x2 = (segments[i + 2] - minX) / (maxX - minX) * width;
        const y2 = (segments[i + 3] - minY) / (maxY - minY) * height;
        const length = Math.hypot(x2 - x1, y2 - y1);
        if (length === 0) {
            continue;
        }

        const tangentX = (x2 - x1) / length;
        const tangentY = (y2 - y1) / length;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const halfLength = length / 2;
        const extent = halfLength + padding;

        // A rectangle around the segment, expressed in its own local coordinates.
        const corners = [
            [-extent, -padding], [extent, -padding], [extent, padding],
            [-extent, -padding], [extent, padding], [-extent, padding],
        ];
        for (const [along, across] of corners) {
            const x = centerX + tangentX * along - tangentY * across;
            const y = centerY + tangentY * along + tangentX * across;
            positions.push(2 * x / width - 1, 2 * y / height - 1, 0, 1);
            strokes.push(along, across, halfLength, halfWidth);
        }
    }
    return { positions, strokes };
}
