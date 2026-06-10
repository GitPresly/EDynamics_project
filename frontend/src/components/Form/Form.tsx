import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { apiService } from '../../services/api';
import type { Submission, SubmissionStatus } from '../../domain/entities/Submission/Submission';
import type { CreateSubmissionRequest } from '../../presentation/requests/Submission/CreateSubmissionRequest';
import type { UpdateSubmissionRequest } from '../../presentation/requests/Submission/UpdateSubmissionRequest';
import './Form.css';

const STATUSES: SubmissionStatus[] = ['Open', 'In Review', 'Approved', 'Declined'];

interface FormState {
  name: string;
  email: string;
  message: string;
  city: string;
  country: string;
  status: SubmissionStatus;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

interface FormProps {
  onSubmitSuccess?: () => void;
  editSubmission?: Submission | null;
  onCancelEdit?: () => void;
}

const EMPTY: FormState = { name: '', email: '', message: '', city: '', country: '', status: 'Open' };

export const Form: React.FC<FormProps> = ({ onSubmitSuccess, editSubmission, onCancelEdit }) => {
  const isEditMode = !!editSubmission;

  const [formData, setFormData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load submission data when editing
  useEffect(() => {
    if (editSubmission) {
      setFormData({
        name: editSubmission.name,
        email: editSubmission.email,
        message: editSubmission.message,
        city: editSubmission.city ?? '',
        country: editSubmission.country ?? '',
        status: editSubmission.status ?? 'Open',
      });
    } else {
      setFormData(EMPTY);
    }
    setErrors({});
    setSubmitMessage(null);
  }, [editSubmission]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitMessage) {
      setSubmitMessage(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (isEditMode && editSubmission) {
        // Update existing submission
        const updateRequest: UpdateSubmissionRequest = {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          city: formData.city || undefined,
          country: formData.country || undefined,
          status: formData.status,
        };
        await apiService.updateSubmission(editSubmission.id, updateRequest);
        setSubmitMessage({ type: 'success', text: 'Submission updated successfully!' });
      } else {
        // Create new submission
        const createRequest: CreateSubmissionRequest = {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          city: formData.city || undefined,
          country: formData.country || undefined,
        };
        await apiService.submitForm(createRequest);
        setSubmitMessage({ type: 'success', text: 'Form submitted successfully!' });
      }

      setFormData(EMPTY);

      // Call success callback to refresh submissions list
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Clear edit mode if editing
      if (isEditMode && onCancelEdit) {
        onCancelEdit();
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit form',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-header">
        <h2 className="form-title">{isEditMode ? 'Edit Submission' : 'Submit a Form'}</h2>
        {isEditMode && onCancelEdit && (
          <button
            type="button"
            className="cancel-button"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      <FormField
        label="Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <div className="form-row">
        <FormField
          label="City"
          name="city"
          type="text"
          value={formData.city}
          onChange={handleChange}
        />
        <FormField
          label="Country"
          name="country"
          type="text"
          value={formData.country}
          onChange={handleChange}
        />
      </div>

      <FormField
        label="Message"
        name="message"
        type="textarea"
        value={formData.message}
        onChange={handleChange}
        error={errors.message}
        required
        rows={5}
      />

      {isEditMode && (
        <div className="form-field">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input form-select"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {submitMessage && (
        <div className={`submit-message ${submitMessage.type}`}>
          {submitMessage.text}
        </div>
      )}

      <button
        type="submit"
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (isEditMode ? 'Updating...' : 'Submitting...')
          : (isEditMode ? 'Update' : 'Submit')
        }
      </button>
    </form>
  );
};
