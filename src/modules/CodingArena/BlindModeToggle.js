import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, Timer } from 'lucide-react';

export default function BlindModeToggle({ blindMode, setBlindMode, onPeekUsed, peeksRemaining }) {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isBlurred, setIsBlurred] = useState(false);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    let timer;
    if (blindMode && !isBlurred && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsBlurred(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blindMode, isBlurred, secondsLeft]);

  const handleToggleBlindMode = () => {
    if (!blindMode) {
      setBlindMode(true);
      setSecondsLeft(120);
      setIsBlurred(false);
    } else {
      setBlindMode(false);
      setIsBlurred(false);
    }
  };

  const handlePeek = () => {
    if (peeksRemaining <= 0 || peeking) return;
    setPeeking(true);
    setIsBlurred(false);
    if (onPeekUsed) onPeekUsed();

    setTimeout(() => {
      setPeeking(false);
      if (blindMode) setIsBlurred(true);
    }, 10000); // 10s peek duration
  };

  return (
    <div className="flex items-center gap-3 bg-background-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs">
      <button
        onClick={handleToggleBlindMode}
        className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded transition-colors ${
          blindMode 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
            : 'bg-background-elevated text-text-secondary hover:text-text-primary'
        }`}
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Blind Mode: {blindMode ? 'ON' : 'OFF'}</span>
      </button>

      {blindMode && (
        <>
          <div className="flex items-center gap-1 text-text-muted font-mono">
            <Timer className="w-3.5 h-3.5 text-accent-primary" />
            <span>
              {isBlurred ? 'Blurred' : `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`}
            </span>
          </div>

          <button
            onClick={handlePeek}
            disabled={peeksRemaining <= 0 || peeking}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-all ${
              peeking
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : peeksRemaining > 0
                ? 'bg-background-elevated hover:bg-background-elevated/80 text-text-primary'
                : 'bg-background-elevated opacity-50 cursor-not-allowed text-text-muted'
            }`}
          >
            {peeking ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{peeking ? 'Peeking (10s)' : `Peek (${peeksRemaining} left)`}</span>
          </button>
        </>
      )}
    </div>
  );
}
