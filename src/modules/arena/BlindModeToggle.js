import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export default function BlindModeToggle({ blindMode, setBlindMode, peeking, triggerPeek, peeksUsed, secondsLeft }) {
  const { addToast } = useUser();

  const handleToggle = () => {
    if (blindMode) {
      addToast("Blind mode is already active for this session.", "error");
      return;
    }
    setBlindMode(true);
    addToast("Blind Mode Activated. Statement blurred.", "info");
  };

  return (
    <div className="flex items-center gap-3">
      {blindMode ? (
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-accent-gold font-mono uppercase tracking-wider font-bold bg-accent-gold/10 px-2 py-1 rounded border border-accent-gold/20">
            Peeks Used: {peeksUsed} / 3
          </div>
          <button 
            onClick={triggerPeek}
            disabled={peeking || peeksUsed >= 3}
            className="bg-accent-gold hover:bg-accent-gold/90 text-black px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {peeking ? 'Peeking...' : 'Peek (5s)'}
          </button>
        </div>
      ) : (
        <button 
          onClick={handleToggle}
          className="text-text-muted hover:text-accent-gold transition-colors flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded hover:bg-background-elevated"
          title="Enable Blind Mode to hide the problem description."
        >
          <EyeOff className="w-4 h-4" /> 
          Blind Mode 
          <span className="font-mono ml-1 text-[10px]">({secondsLeft}s left)</span>
        </button>
      )}
    </div>
  );
}
