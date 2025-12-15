import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>{message || 'Loading...'}</p>
      </div>
    </div>
  );
}

