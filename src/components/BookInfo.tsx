import { useRef } from 'react';
import './BookInfo.css';

interface BookInfoProps {
  show: boolean;
  bookName: string;
  onOpenBook: () => void;
}

export function BookInfo({ show, bookName, onOpenBook }: BookInfoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onOpenBook();
          }
        }}
      />
      <div className={`book-info ${show ? 'show' : ''}`}>
        <div className="book-info-text">
          <strong>📖</strong> <span>{bookName}</span>
        </div>
        <button onClick={handleClick}>Open Different Book</button>
      </div>
    </>
  );
}

