import { useRef } from 'react';
import './FileButton.css';

interface FileButtonProps {
  onFileSelect: (file: File) => void;
}

export function FileButton({ onFileSelect }: FileButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <button className="file-btn" onClick={handleClick}>
        Open EPUB
      </button>
    </>
  );
}

