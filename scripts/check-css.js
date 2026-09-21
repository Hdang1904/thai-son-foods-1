async function main() {
  const res = await fetch('http://localhost:3000');
  const html = await res.text();
  const cssMatches = [...html.matchAll(/\/(_next\/static\/css\/[^"']+)/g)].map(m => m[1]);
  const cssList = await Promise.all(cssMatches.map(url => fetch('http://localhost:3000/' + url).then(r => r.text())));
  const fullCss = cssList.join('\n');
  console.log('Includes 520px:', fullCss.includes('520px'));
  const matches = fullCss.match(/[^{}]*520px[^{}]*\{[^{}]*\}/g);
  console.log('Rules matching 520px:', matches ? matches.slice(0, 5) : 'None');
}
main();
