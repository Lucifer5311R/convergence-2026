// ============================================================
// CONVERGENCE 2026 — Data
// ============================================================

import participantsData from './data/generated/participants.json';
import leaderboardData from './data/generated/leaderboard.json';

// Live data generated from registration files — run `npm run build-data`
// after dropping updated CSV/XLSX files into /files.
export const PARTICIPANT_DATA = participantsData;
export const LEADERBOARD = leaderboardData;

export const FEST_DATE = new Date('2026-08-24T09:00:00+05:30');

import { EVENTS as SOURCE_EVENTS } from './data/events.source.js';
import eventsData from './data/generated/events.json';

// Merged with admin overrides — regenerate via `npm run build-data`
export const EVENTS = eventsData.length ? eventsData : SOURCE_EVENTS;

export const SCHEDULE = {
  day1: {
    date: 'August 10 – 14, 2026',
    events: [
      { time: 'Aug 10', title: 'Vertex & Math Minister Prelims', desc: 'Online / Selected Rooms - 10:00 AM' },
      { time: 'Aug 11', title: 'Cipher & Coin Prelims', desc: 'Computer Labs - 11:30 AM' },
      { time: 'Aug 12', title: 'Math Heist Clue Release', desc: 'Campus-wide qualifier rounds' },
      { time: 'Aug 13', title: "Traitor's Algorithm Simulation", desc: 'Strategic games screening' },
      { time: 'Aug 14', title: 'Numero Bingo & Project Infinity Abstracts', desc: 'Submission deadline and qualifiers' },
    ],
  },
  day2: {
    date: 'August 24, 2026',
    events: [
      { time: '08:30', title: 'Registration & Final Check-in', desc: 'Main Auditorium Foyer' },
      { time: '09:30', title: 'Grand Opening Ceremony', desc: 'Inaugural address & keynote' },
      { time: '10:30', title: 'Math Minister & Vertex Finals', desc: 'Main Stage / Seminar Rooms' },
      { time: '12:00', title: 'Cipher & Coin Final Showdown', desc: 'Computer Lab' },
      { time: '13:00', title: 'Lunch Break', desc: 'Campus Cafeteria' },
      { time: '14:00', title: 'Math Heist Final Run & Numero Bingo', desc: 'Campus-wide chase & Auditorium B' },
      { time: '15:30', title: "Traitor's Algorithm & Project Infinity Presentations", desc: 'Main Stage' },
      { time: '17:00', title: 'Closing Ceremony & Prize Distribution', desc: 'Main Auditorium' },
    ],
  },
};

export const LAST_YEAR = {
  stats: [
    { value: 450, suffix: '+', label: 'Participants' },
    { value: 42, suffix: '', label: 'Colleges' },
    { value: 8, suffix: '', label: 'Events' },
    { value: 155, suffix: '', label: 'Volunteers' },
    { value: 75, suffix: 'K+', label: 'Prize Pool (₹)' },
  ],
  winners: [
    {
      rank: 1,
      rankClass: 'gold',
      team: 'Team Axiom',
      college: "St. Joseph's College, Bengaluru",
      score: 945,
      eventsWon: 'Math Survival, The Da Vinci Dilemma',
    },
    {
      rank: 2,
      rankClass: 'silver',
      team: 'The Primes',
      college: 'PES University, Bengaluru',
      score: 892,
      eventsWon: 'The Mathverse, ShareWars',
    },
    {
      rank: 3,
      rankClass: 'bronze',
      team: 'Set Theorists',
      college: 'Mount Carmel College, Bengaluru',
      score: 847,
      eventsWon: 'Maths ka Mahayudh, Puzzle Bids',
    },
  ],
  eventRecap: [
    { event: 'The Mathverse', winner: 'The Primes', college: 'PES University' },
    { event: 'Math Survival', winner: 'Team Axiom', college: "St. Joseph's College" },
    { event: 'ShareWars', winner: 'The Primes', college: 'PES University' },
    { event: 'Maths ka Mahayudh', winner: 'Set Theorists', college: 'Mount Carmel College' },
    { event: 'Mathethon', winner: 'Set Theorists', college: 'Mount Carmel College' },
    { event: 'The Da Vinci Dilemma', winner: 'Team Axiom', college: "St. Joseph's College" },
    { event: 'Fifa theta', winner: 'Aarav Mehta', college: 'BMS College' },
    { event: 'Puzzle Bids', winner: 'Sneha Rao', college: 'Jain University' },
  ],
  testimonial: {
    quote: 'CONVERGENCE was unlike any mathematics competition I have attended. The energy, the challenges, the cinematic production — it felt like we were part of something truly extraordinary.',
    author: 'Aarav Mehta — BMS College of Engineering, Winner of Fifa theta 2025',
  },
};

export const FACULTY = [
  { name: 'Dr. Riya Baby', role: 'Faculty Coordinator', initials: 'RB' },
  { name: 'Dr. Sangeetha', role: 'Faculty Coordinator', initials: 'S' },
];

export const STUDENTS = [
  { name: 'Dhinesh Karthik', role: 'Student Coordinator' },
  { name: 'Vaani', role: 'Student Coordinator' },
  { name: 'Jefferey', role: 'Student Coordinator' },
];

export const GALLERY_ITEMS = [
  { id: 1, title: 'Teaser Trailer', type: 'video', videoUrl: '/videos/teaser-1.mp4' },
  { id: 2, title: 'Cipher & Coin Poster', type: 'poster', imgUrl: '/gallery/cipher-poster.png' },
  { id: 3, title: 'Vertex Prelims Poster', type: 'poster', imgUrl: '/gallery/vortex-prelims.png' },
  { id: 4, title: "Traitor's Algorithm Finals Poster", type: 'poster', imgUrl: '/gallery/traitor-finals.png' },
  { id: 5, title: 'Aftermovie Highlights', type: 'video', videoUrl: '/videos/teaser-2.mp4' },
  { id: 6, title: 'Math Minister Prelims Poster', type: 'poster', imgUrl: '/gallery/math-minister-prelims.png' },
  { id: 7, title: 'Odds & Overdrive Reel', type: 'video', videoUrl: '/videos/odds-overdrive-reel.mp4' },
  { id: 8, title: 'Project Infinity Main Poster', type: 'poster', imgUrl: '/gallery/project-infinity-main.jpg' },
  { id: 9, title: 'Numero Bingo Poster', type: 'poster', imgUrl: '/gallery/numero-bingo.png' },
  { id: 10, title: 'Odds & Overdrive Finals Poster', type: 'poster', imgUrl: '/gallery/odds-finals.jpg' },
  { id: 11, title: 'Vertex Finals Poster', type: 'poster', imgUrl: '/gallery/vortex-finals.png' },
  { id: 12, title: "Traitor's Algorithm Moment", type: 'photo', imgUrl: '/gallery/traitor-moment.jpg' },
  { id: 13, title: 'Math Heist Moment', type: 'photo', imgUrl: '/gallery/math-heist-moment.jpg' },
  { id: 14, title: 'Math Minister Finals Poster', type: 'poster', imgUrl: '/gallery/math-minister-finals.jpg' },
  { id: 15, title: 'Project Infinity Prelims Poster', type: 'poster', imgUrl: '/gallery/project-infinity-prelims.png' },
  { id: 16, title: 'Numero Bingo Finals Poster', type: 'poster', imgUrl: '/gallery/numero-bingo-finals.png' },
];

export const FAQS = [
  {
    question: 'Who can participate in CONVERGENCE 2026?',
    answer: 'CONVERGENCE 2026 is open to all undergraduate and postgraduate students from any recognized college or university across India. Participants must carry a valid college ID.',
  },
  {
    question: 'Is there a registration fee?',
    answer: 'Yes, there is a nominal registration fee of ₹200 per participant (covers all events). Group discounts are available for teams of 10+ from the same college.',
  },
  {
    question: 'Can we register for multiple events?',
    answer: 'Yes! You can register for as many events as you like, provided there are no scheduling conflicts. We recommend checking the schedule before registering for overlapping events.',
  },
  {
    question: 'What is the team size for events?',
    answer: 'Team sizes vary by event — from individual (Vertex, Odds & Overdrive, Numero Bingo) to teams of 4 (Math Heist). Check each event\'s details for specific team size requirements.',
  },
  {
    question: 'Where is the venue?',
    answer: 'CONVERGENCE 2026 will be held at CHRIST (Deemed to be University), Hosur Road, Bengaluru — 560029. All events take place across the Main Campus.',
  },
  {
    question: 'Will accommodation be provided?',
    answer: 'Accommodation is not provided by the organizers. However, we can assist with recommendations for nearby hotels and PGs. Contact us for assistance.',
  },
  {
    question: 'How are winners decided?',
    answer: 'Winners are determined through a combination of round-wise scores, time efficiency, and judge evaluations. Each event has its own scoring criteria detailed in the rules.',
  },
  {
    question: 'How can I contact the organizers?',
    answer: 'Reach us via email at convergence@christuniversity.in or call +91 98XXX XXXXX. You can also DM us on Instagram @convergence.christ.',
  },
];

export const CONTACT_INFO = {
  email: 'convergence@christuniversity.in',
  phone: '+91 98XXX XXXXX',
  phoneUrl: 'tel:+919800000000',
  location: 'CHRIST (Deemed to be University), Hosur Road, Bengaluru — 560029',
  instagram: '@convergence.christ',
  instagramUrl: 'https://instagram.com/convergence.christ',
};

export const ABOUT_STATS = [
  { value: 200, suffix: '+', label: 'Participants' },
  { value: 15, suffix: '+', label: 'Colleges' },
  { value: 8, suffix: '', label: 'Events' },
  { value: 13, suffix: 'K', label: 'Prize Pool (₹)' },
];

