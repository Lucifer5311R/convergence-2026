import { useState, useEffect } from 'react';

// Precompute Fibonacci numbers
const fib = [0, 1];
for (let i = 2; i <= 45; i++) {
  fib[i] = fib[i - 1] + fib[i - 2];
}

const GOLDEN_RATIO = 1.618033988749895;

export default function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  const [step, setStep] = useState(2); // n goes from 2 to 35
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // Increment step rapidly to show convergence
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= 35) {
          clearInterval(interval);
          setComplete(true);
          return 35;
        }
        return prev + 1;
      });
    }, 35);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (complete) {
      const timer = setTimeout(() => {
        setHidden(true);
      }, 700); // Hold for a moment when converged
      return () => clearTimeout(timer);
    }
  }, [complete]);

  const fN = fib[step];
  const fN1 = fib[step - 1];
  const currentRatio = fN / fN1;
  const ratioStr = currentRatio.toFixed(10);
  const targetStr = GOLDEN_RATIO.toFixed(10);

  // Find how many decimal places have converged
  let convergedIndex = 0;
  for (let i = 0; i < ratioStr.length; i++) {
    if (ratioStr[i] === targetStr[i]) {
      convergedIndex++;
    } else {
      break;
    }
  }

  return (
    <div className={`loading-screen ${hidden ? 'hidden' : ''}`}>
      <div className="loading-container">
        <div className="loading-logo">CONVERGENCE</div>
        
        <div className="math-container">
          <div className="math-formula">
            <span>{"lim_{n → ∞} F_n / F_{n-1} = Φ"}</span>
          </div>

          <div className="math-sequence-term">
            <span className="term-label">[n = {step.toString().padStart(2, '0')}]</span>
            <span className="term-fraction">
              <span className="numerator">{fN}</span>
              <span className="denominator">{fN1}</span>
            </span>
            <span className="term-equals">=</span>
            <span className="term-value">
              <span className="converged-part">{ratioStr.substring(0, convergedIndex)}</span>
              <span className="oscillating-part">{ratioStr.substring(convergedIndex)}</span>
            </span>
          </div>
        </div>

        <div className="loading-bar-wrapper">
          <div className="loading-bar-fill" style={{ width: `${(step / 35) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
