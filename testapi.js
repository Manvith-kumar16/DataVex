const q = `
[out:json];
node["office"](around:5000, 12.9716, 77.5946);
out 30;
`;

fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`
}).then(r => r.text()).then(console.log).catch(console.error);
