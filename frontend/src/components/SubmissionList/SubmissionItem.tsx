import React from 'react';
import type { Submission } from '../../domain/entities/Submission/Submission';
import './SubmissionList.css';

interface SubmissionItemProps {
  submission: Submission;
  onEdit?: (submission: Submission) => void;
  onDelete?: (id: string) => void; // Add this line
}

export const SubmissionItem: React.FC<SubmissionItemProps> = ({ 
  submission, 
  onEdit, 
  onDelete // Destructure here
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="submission-item">
      <div className="submission-header">
        <div className="submission-author">
          <strong>{submission.name}</strong>
          <span className="submission-email">{submission.email}</span>
        </div>
        <span className="submission-date">{formatDate(submission.createdAt)}</span>
      </div>
      <div className="submission-message">{submission.message}</div>
      
      {/* Container for actions */}
      <div className="submission-actions">
        {onEdit && (
          <button
            className="edit-button"
            onClick={() => onEdit(submission)}
            title="Edit submission"
          >
            ✏️ Edit
          </button>
        )}
        
        {/* Add the Delete Button */}
        {onDelete && (
          <button
            className="delete-button"
            onClick={() => onDelete(submission.id)}
            title="Delete submission"
            style={{ color: '#d32f2f', marginLeft: '8px' }} // Optional: simple inline style if CSS isn't updated yet
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
};