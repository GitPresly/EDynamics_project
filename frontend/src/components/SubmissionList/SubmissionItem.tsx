import React from 'react';
import type { Submission } from '../../domain/entities/Submission/Submission';
import './SubmissionList.css';

interface SubmissionItemProps {
  submission: Submission;
  onEdit?: (submission: Submission) => void;
  onDelete?: (id: string) => void;
}

export const SubmissionItem: React.FC<SubmissionItemProps> = ({ 
  submission, 
  onEdit, 
  onDelete 
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
        {/* Status Badge */}
        <div className={`status-badge ${(submission.status || 'Open').toLowerCase().replace(' ', '-')}`}>
          {submission.status || 'Open'}
        </div>
      </div>

      {/* Location Row */}
      <div className="submission-location">
        📍 {submission.city || 'N/A'}{submission.city && submission.country ? ', ' : ''}{submission.country || ''}
      </div>

      <div className="submission-message">{submission.message}</div>
      
      <div className="submission-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span className="submission-date">{formatDate(submission.createdAt)}</span>
        
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
          
          {onDelete && (
            <button
              className="delete-button"
              onClick={() => onDelete(submission.id)}
              title="Delete submission"
              style={{ color: '#d32f2f', marginLeft: '8px' }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};