import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import './WelcomeGuide.css';

export const WELCOME_SEEN_KEY = 'epub-reader-welcome-seen';

export interface WelcomeGuideHandle {
  show: () => void;
}

export const WelcomeGuide = forwardRef<WelcomeGuideHandle, {}>((_props, ref) => {
  const [show, setShow] = useState(false);

  useImperativeHandle(ref, () => ({
    show: () => setShow(true),
  }));

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!hasSeenWelcome) {
      // Small delay for dramatic effect
      setTimeout(() => setShow(true), 300);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="welcome-overlay" onClick={handleDismiss}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-close" onClick={handleDismiss} aria-label="Close">
          ✕
        </button>
        
        <div className="welcome-content">
          <h1 className="welcome-title">📚 Welcome, Bookworm! 📚</h1>
          
          <div className="welcome-section">
            <h2>🎯 Step 1: Find Your Book</h2>
            <p>
              Click that fancy "Open" button up there (yes, the one that's probably staring at you).
              Pick an EPUB file. <em>Any EPUB file.</em> We're not picky. Well, we are, but we'll pretend we're not.
            </p>
          </div>

          <div className="welcome-section">
            <h2>👆 Step 2: Click Words Like a Pro</h2>
            <p>
              See a word you don't know? Click it! Want to know what "sesquipedalian" means? 
              Click it! (Spoiler: it means "using long words" - how meta!)
            </p>
            <p className="welcome-tip">
              💡 <strong>Pro tip:</strong> Click multiple words quickly to look up entire phrases. 
              You have 0.8 seconds to be indecisive - use them wisely!
            </p>
          </div>

          <div className="welcome-section">
            <h2>📝 Step 3: Summary Markers (The Plot Thickens!)</h2>
            <p>
              Every 5000 characters, we've placed a sneaky summary marker. Click it to get an AI-powered 
              summary of what you just read. Perfect for when you zoned out thinking about pizza.
            </p>
          </div>

          <div className="welcome-section">
            <h2>💾 Step 4: We Remember Everything</h2>
            <p>
              Your book? Saved. Your reading position? Saved. Your dignity after falling asleep mid-chapter? 
              Also saved (in our hearts). Everything persists automatically - we're like elephants, but useful.
            </p>
          </div>

          <div className="welcome-section">
            <h2>🌙 Step 5: Dark Mode (Because We're Fancy)</h2>
            <p>
              Toggle that moon/sun button in the top panel. Your retinas will thank you at 2 AM when you're 
              reading that thriller you can't put down.
            </p>
          </div>

          <div className="welcome-section welcome-final">
            <h2>🎉 You're Ready!</h2>
            <p>
              That's it! You're now a certified EPUB reading ninja. Go forth and read! 
              And remember: if you get lost, just click words. It's therapeutic.
            </p>
          </div>

          <button className="welcome-button" onClick={handleDismiss}>
            Got it! Let me read! 📖
          </button>
        </div>
      </div>
    </div>
  );
});

WelcomeGuide.displayName = 'WelcomeGuide';

