// Quick sanity test for typo-tolerant event matching
import { normalizeEvent } from './build-data.mjs';

const cases = [
  // [input, expected]
  ['Vortext (2 Participants)', 'Vertex'],
  ['vertext', 'Vertex'],
  ['Votex', 'Vertex'],
  ['Verterx', 'Vertex'],
  ['vortex', 'Vertex'],
  ['VERTEX', 'Vertex'],
  ['Maths Miniter', 'Math Minister'],
  ['Ciper & Coin', 'Cipher & Coin'],
  ['Traitors Algorithm', "Traitor's Algorithm"],
  ['Numero Bngo', 'Numero Bingo'],
  ['Project Infnity', 'Project Infinity'],
  ['Ods & Overdrive', 'Odds & Overdrive'],
  ['Math Heist', 'Math Heist'],
  ['Project Infinity (11:30 am - 01:00 pm) (3 Participants)', 'Project Infinity'],
  ['', null],
  ['random gibberish xyz', null],
];

let pass = 0; let fail = 0;
for (const [input, expected] of cases) {
  const got = normalizeEvent(input);
  const ok = got === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} "${input}" -> ${got}${ok ? '' : ` (expected ${expected})`}`);
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
