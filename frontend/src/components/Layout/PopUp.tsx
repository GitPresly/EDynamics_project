import React from 'react';
import './PopUp.css';

interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const PopUp: React.FC<PopUpProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-icon">⚠️</div>
        <h2 className="popup-title">{title}</h2>
        <p className="popup-message">{message}</p>
        <button className="popup-button" onClick={onClose}>
          Understood
        </button>
      </div>
    </div>
  );
};