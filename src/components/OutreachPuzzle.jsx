import { useState } from 'react';

const PUZZLES = [
  {
    id: 1,
    badge: 'Logic & Rates',
    title: 'Cats & Mice Riddle',
    text: 'If 3 cats catch 3 mice in 3 minutes, how many cats are needed to catch 100 mice in 100 minutes?',
    placeholder: 'Enter numerical value or words...',
    validate: (ans) => {
      const clean = ans.trim().toLowerCase();
      return clean === '3' || clean === 'three' || clean.includes('3 cats');
    },
    code: 'LOGIC3',
    reward: '15% Group Entry Discount benefit!',
  },
  {
    id: 2,
    badge: 'Cognitive Algebra',
    title: 'The Bat & Ball Pricing',
    text: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost in cents?',
    placeholder: 'Enter price in cents (e.g. 5)...',
    validate: (ans) => {
      const clean = ans.trim().toLowerCase();
      return clean === '5' || clean === 'five' || clean.includes('5 cents') || clean === '0.05' || clean === '$0.05';
    },
    code: 'ALGEBRA5',
    reward: 'Free entry to Vertex event!',
  },
  {
    id: 3,
    badge: 'Number Theory',
    title: 'The Golden Spiral Sequence',
    text: 'Which famous sequence starts with 0, 1, 1, 2, 3, 5, 8, 13, where each number is the sum of the two preceding ones?',
    placeholder: 'Enter name of sequence...',
    validate: (ans) => {
      const clean = ans.trim().toLowerCase();
      return clean.includes('fibonacci');
    },
    code: 'GOLDEN1.618',
    reward: 'Exclusive mathematically-themed sticker pack at check-in!',
  },
];

export default function OutreachPuzzle() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const currentPuzzle = PUZZLES[activeIdx];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentPuzzle.validate(answer)) {
      setFeedback({
        success: true,
        message: `Correct! Logic is your weapon. Use the code "${currentPuzzle.code}" at registration to claim your: ${currentPuzzle.reward}`,
      });
    } else {
      setFeedback({
        success: false,
        message: 'Incorrect! Check your calculations and try again.',
      });
    }
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % PUZZLES.length);
    setAnswer('');
    setFeedback(null);
  };

  return (
    <div className="outreach-puzzle-card">
      <div className="puzzle-header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="puzzle-badge">{currentPuzzle.badge}</div>
        <button className="puzzle-nav-btn" onClick={handleNext} style={{ background: 'none', border: '1px solid rgba(193, 18, 31, 0.3)', color: 'var(--accent)', cursor: 'pointer', padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Next Riddle ➔
        </button>
      </div>
      <h3 className="puzzle-title">{currentPuzzle.title}</h3>
      <p className="puzzle-text">"{currentPuzzle.text}"</p>
      
      <form onSubmit={handleSubmit} className="puzzle-form">
        <input
          type="text"
          className="puzzle-input"
          placeholder={currentPuzzle.placeholder}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button type="submit" className="puzzle-submit-btn">Verify</button>
      </form>

      {feedback && (
        <div className={`puzzle-feedback ${feedback.success ? 'success' : 'error'}`} style={{ transition: 'all 0.3s ease' }}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
