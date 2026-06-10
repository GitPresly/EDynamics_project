import React from 'react';
import type { Submission } from '../../domain/entities/Submission/Submission';
import './SubmissionList.css';

interface SubmissionItemProps {
  submission: Submission;
  onEdit?: (submission: Submission) => void;
  onDelete?: (id: string) => void;
}

export const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, onEdit, onDelete }) => {
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

  const location = [submission.city, submission.country].filter(Boolean).join(', ');
  const statusClass = `status-${submission.status.toLowerCase().replace(' ', '-')}`;

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this submission?')) {
      onDelete(submission.id);
    }
  };

  return (
    <div className="submission-item">
      <div className="submission-header">
        <div className="submission-author">
          <strong>{submission.name}</strong>
          <span className="submission-email">{submission.email}</span>
        </div>
        <span className={`status-badge ${statusClass}`}>{submission.status}</span>
      </div>
      <div className="submission-meta">
        {location && <span className="submission-location">📍 {location}</span>}
        <span className="submission-date">{formatDate(submission.createdAt)}</span>
      </div>
      <div className="submission-message">{submission.message}</div>
      {(onEdit || onDelete) && (
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
              onClick={handleDelete}
              title="Delete submission"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
