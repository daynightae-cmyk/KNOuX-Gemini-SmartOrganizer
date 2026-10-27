/**
 * Deterministic local fixture thumbnail.
 *
 * Several fixtures used to point at remote Unsplash photographs for decorative
 * art. That made screenshot evidence depend on the network, contacted a third
 * party on every render, and contradicted the repository's rule that remote
 * contact must be explicit and policy-controlled.
 *
 * This returns a small inline SVG gradient as a data URI, so a fixture can keep
 * a recognisable thumbnail with no request leaving the machine. The hue is
 * supplied by the caller so a gallery stays visually varied but fully
 * reproducible.
 */
export function localFixtureThumb(hue: number, width = 160, height = 90): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 62% 44%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 38) % 360} 58% 24%)"/></linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
    `<circle cx="${Math.round(width * 0.74)}" cy="${Math.round(height * 0.31)}" r="${Math.round(height * 0.17)}" fill="hsl(${hue} 72% 74%)" opacity=".45"/>` +
    `<path d="M0 ${Math.round(height * 0.76)} L${Math.round(width * 0.28)} ${Math.round(height * 0.44)} L${Math.round(width * 0.46)} ${Math.round(height * 0.69)} L${Math.round(width * 0.68)} ${Math.round(height * 0.38)} L${width} ${Math.round(height * 0.73)} L${width} ${height} L0 ${height} Z" fill="hsl(${(hue + 20) % 360} 45% 16%)" opacity=".6"/>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}