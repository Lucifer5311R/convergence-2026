// ============================================================
// CONVERGENCE 2026 — Events Source Data
// Editable via the admin panel (#/admin) — overrides land in
// files/admin-events.json and are merged by npm run build-data.
// ============================================================

export const EVENTS = [
  {
    id: 1,
    number: '01',
    name: 'Math Minister',
    tags: 'Strategy · Leadership · Debate',
    quote: '"Lead. Argue. Conquer."',
    bgClass: 'event-bg-grid',
    posterUrl: '/gallery/math-minister-prelims.png',
    description: 'Step into the role of a mathematical strategist. Defend policies built on logic, dismantle opponents with data, and lead your team to victory through razor-sharp argumentation and number-backed persuasion.',
    rules: [
      'Teams of 3–4 members',
      'Each round involves a mathematical policy debate',
      'Judges score on logic, data usage, and presentation',
      'Top 4 teams advance to the final round',
    ],
    teamSize: '3–4',
    duration: '2 hours',
    prizes: '₹2,500',
    difficulty: 'Strategic Logic (Friendly for All)',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: []
  },
  {
    id: 2,
    number: '02',
    name: 'Vertex',
    tags: 'Precision · Problem Solving',
    quote: '"Precision is not a skill. It\'s a weapon."',
    bgClass: 'event-bg-vertex',
    posterUrl: '/gallery/vortex-prelims.png',
    description: 'A rigorous problem-solving competition that tests mathematical precision, speed, and depth. From algebra to combinatorics, only the sharpest minds survive each elimination round.',
    rules: [
      'Individual or duo participation',
      'Three rounds: Prelims, Semi-finals, Finals',
      'Time-bound problem sets of increasing difficulty',
      'No calculators allowed',
    ],
    teamSize: '1–2',
    duration: '3 hours',
    prizes: '₹2,000',
    difficulty: 'Core Mathematics (Advanced)',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: []
  },
  {
    id: 3,
    number: '03',
    name: 'Cipher & Coin',
    tags: 'Cryptography · Finance · Logic',
    tagline: 'Spend Wisely, Think Quickly, Win Confidently',
    quote: '"Spend Wisely, Think Quickly, Win Confidently."',
    bgClass: 'event-bg-cipher',
    description: 'Cipher & Coin is a team-based mathematical strategy game. Use virtual currency to bid on and unlock logic, crypto, and finance questions of varying difficulties immediately.',
    rules: [
      'Team Size: exactly 3 members. Starts with 80 units of virtual currency.',
      'Four difficulty levels with predefined costs and point values.',
      'Correct answers earn full points. Incorrect answers deduct 25% of the point value.',
      'Incorrectly attempted questions can be repurchased by other teams at 50% price.',
      'Special activities: Mystery Boxes, Lucky Pick, Hint Challenges, and Special Auction.',
      'Final Score = Total Points Earned + 25% of Remaining Game Currency.'
    ],
    teamSize: '3',
    duration: '90–120 mins',
    prizes: '₹2,000',
    difficulty: 'Crypto & Finance',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: [
      { name: 'DEVIKA MADNANI', phone: '7897939808' },
      { name: 'NAVEEN SINGH S', phone: '9036260651' }
    ],
    dateTime: '14 August 2026',
    venue: 'Block II, Room No 726 (2nd Floor)',
    posterUrl: '/gallery/cipher-poster.png'
  },
  {
    id: 4,
    number: '04',
    name: 'Math Heist',
    tags: 'Puzzle Chase · Teamwork',
    tagline: 'Decode. Strategize. Unlock.',
    quote: '"Every puzzle is a vault. Every solution, a key."',
    bgClass: 'event-bg-heist',
    description: 'Solve mathematical challenges, place bets in the Math Casino, and race against the clock to unlock the vault. Complete rounds collaboratively without electronic devices to secure the highest score.',
    rules: [
      'Teams of 3–4 participants. No mobile phones, calculators, or smart devices.',
      'Round 1 (The Cipher Lock): Solve challenges. Completing within 10 mins awards 100 pts (-10 pts per subsequent 10 mins). Top 10 teams qualify.',
      'Round 2 (Math Casino): Start with 10 chips. Bet 2 to 4 chips at Probability Palace, Equation Blackjack, Factor Auction, or Matrix Vault. Correct answers double the bet points.',
      'Round 3 (Code Detector): Final sheet challenge. Fastest completion (within 10 mins) awards 100 pts (-10 pts per subsequent 10 mins). Top 8 qualify.',
      'Overall winner decided by aggregate score across all three rounds.'
    ],
    teamSize: '3–4',
    duration: '2 hours',
    prizes: '₹1,500',
    difficulty: 'Strategy & Puzzle Chase',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: [
      { name: 'Himanshu Singh', phone: '7000422028' },
      { name: 'Subhodeep Dey', phone: '9362763923' }
    ]
  },
  {
    id: 5,
    number: '05',
    name: "Traitor's Algorithm",
    tags: 'Game Theory · Deception · Strategy',
    tagline: 'Solve to survive. Calculate to defeat.',
    quote: '"Solve to survive. Calculate to defeat."',
    bgClass: 'event-bg-traitor',
    posterUrl: '/gallery/traitor-poster.png',
    description: 'An interactive game theory showdown inspired by social deduction. Play as Crewmates trying to solve station tasks or as Impostors attempting to eliminate other teams using advanced mathematical sabotages.',
    rules: [
      'Team Size: 2 members. 1 Prelims + 2 Final Rounds. Duration: 2-2.5 hours.',
      'Prelims: Circle mistakes in 5 correct and 5 imposter derivations. Fastest 15 teams advance.',
      'Crewmates: Visit 6 stations in Task Passport order. Wrong answers incur a mandatory 30-sec reboot penalty.',
      'Impostors: Solve advanced math from Sabotage Log, write target Team Number to eliminate Crewmates.',
      'Kills trigger emergency meetings. All movement stops. Discussions and voting determine who to eject.',
      'No talking between teams except during emergency meetings. No sharing envelope contents.'
    ],
    teamSize: '2',
    duration: '2 – 2.5 hours',
    prizes: '₹1,500',
    difficulty: 'Game Theory & Deduction',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: [],
    dateTime: '13 August 2026',
    time: '12:45 PM & 3:45 PM',
    venue: 'Block II, Room No 726 (2nd Floor)'
  },
  {

    id: 6,
    number: '06',
    name: 'Odds & Overdrive',
    tags: 'Probability · Risk · Speed',
    tagline: 'Where arcade strategy meets the laws of chance',
    quote: '"Calculate the risk. Take the leap."',
    bgClass: 'event-bg-odds',
    posterUrl: '/gallery/odds-finals.jpg',
    description: 'Combine vintage gaming strategy with probability math. Navigate coordinate planes to sneak past ghosts in the qualifiers, then play a high-stakes board game using mathematical calculations and power-ups.',
    rules: [
      'Exactly 2 participants per team. Rough papers and writing instruments required.',
      'Prelim 1: Pacman moves across 10x10 coordinate grid to sneak past ghosts, eat a cherry, and hunt ghosts by t = 12.',
      'Prelim 2: Teams submit a turn-by-turn path from (0,0) to exit at (9,9) at exactly t = 11 without colliding with ghosts.',
      'Finals: Top 4 teams compete on a 64-square board. Roll a die to move, solve math problems to progress.',
      'Hard zone deactivates and disables all power-ups for 1 round.',
      'Power-up Wheel: Deploy Mirror, Swap, Advantage, Vertical, Self Destruct, or Choose Your Own power-up by solving pre-selected area math questions.'
    ],
    teamSize: '2',
    duration: '1.5 hours',
    prizes: '₹1,200',
    difficulty: 'Probability & Arcade strategy',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: []
  },
  {
    id: 7,
    number: '07',
    name: 'Numero Bingo',
    tags: 'Fun Math · Quick Thinking',
    quote: '"Numbers are the game. Speed is the name."',
    bgClass: 'event-bg-bingo',
    posterUrl: '/gallery/numero-bingo.png',
    description: 'A fast-paced, math-based twist on classic bingo. Solve arithmetic, algebra, and logic puzzles displayed on the board to scratch numbers on your card. First team to hit a blackout wins.',
    rules: [
      'Teams of 2 participants (fixed). No calculators, phones, or external aids allowed.',
      'Each team receives a 5x5 bingo card numbered 1 to 25.',
      'Math problems are displayed. Scratch the number matching the answer. Early or incorrect marks disqualify that cell.',
      'Raise hand and shout BINGO to verify card. First to achieve a full blackout (all 25 cells) wins.',
      'Single round divided into 5 sections totaling 90 minutes. Difficulty increases section by section.'
    ],
    teamSize: '2',
    duration: '90 minutes',
    prizes: '₹1,000',
    difficulty: 'Fun Math (Suitable for All)',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: []
  },
  {
    id: 8,
    number: '08',
    name: 'Project ∞ (Project Infinity)',
    tags: 'Innovation · Presentation · Research',
    tagline: 'Solve. Decode. Discover.',
    quote: '"Think beyond limits. Present the infinite."',
    bgClass: 'event-bg-infinity',
    posterUrl: '/gallery/project-infinity-main.jpg',
    description: 'A team-based mathematical adventure and treasure hunt. Crack logic puzzles, reconstruct math sequences physically on the floor, and decode hidden clues to race to the finish line.',
    rules: [
      'Teams of 3–4 members. Teams must remain physically together at all times.',
      'No mobile phones, calculators, smart devices, or external internet assistance.',
      'Level 1 (Grid Hunt): Solve 5-6 arithmetic problems, map responses to letters, and unscramble them into mathematical terms.',
      'Level 2 (Sequence Relay): 2 minutes to solve sequence, reconstruct physically on floor. Timings from Level 1+2 decide Finale order.',
      'Level 3 (Math Treasure Hunt): Solve puzzles (triangle counts, magic squares) for color clues to find the encoded envelope leading to the Math Department.',
      'Shortest overall completion time (including level times, accuracy, and positioning penalties) determines the winner.'
    ],
    teamSize: '3–4',
    duration: '2 hours',
    prizes: '₹1,300',
    difficulty: 'Adventure & Logic',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfXYZ/viewform',
    contacts: [
      { name: 'A Little Emarancia Jiji', phone: '9380338720', email: 'littleemarancia.jiji@bscpmh.christuniversity.in' },
      { name: 'Alan Thomas Jacob', phone: '9986870833', email: 'alanthomas.jacob@bscpmh.christuniversity.in' }
    ]
  },
];
