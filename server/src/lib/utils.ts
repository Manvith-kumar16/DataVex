export function extractName(domain: string): string {
    const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\.(com|io|co|net|org|dev|ai|tech|xyz).*$/, '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

export function sr(seed: number, i: number): number {
    const x = Math.sin(seed + i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}
