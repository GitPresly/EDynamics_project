import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { apiService } from '../../services/api';
import type { Submission } from '../../domain/entities/Submission/Submission';
import type { CreateSubmissionRequest } from '../../presentation/requests/Submission/CreateSubmissionRequest';
import type { UpdateSubmissionRequest } from '../../presentation/requests/Submission/UpdateSubmissionRequest';
import './Form.css';

interface FormProps {
  onSubmitSuccess?: () => void;
  editSubmission?: Submission | null;
  onCancelEdit?: () => void;
  onError?: (message: string) => void;
}

export const Form: React.FC<FormProps> = ({ onSubmitSuccess, editSubmission, onCancelEdit, onError }) => {
  const [formData, setFormData] = useState<CreateSubmissionRequest>({
    name: '', email: '', message: '',
  });

  const isEditMode = !!editSubmission;

  useEffect(() => {
    if (editSubmission) {
      setFormData({ name: editSubmission.name, email: editSubmission.email, message: editSubmission.message });
    } else {
      setFormData({ name: '', email: '', message: '' });
    }
  }, [editSubmission]);

  const [errors, setErrors] = useState<Partial<Record<keyof CreateSubmissionRequest, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateSubmissionRequest]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (submitMessage) setSubmitMessage(null);
  };

  const validate = (): boolean => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (isEditMode && editSubmission) {
        await apiService.updateSubmission(editSubmission.id, formData);
        setSubmitMessage({ type: 'success', text: 'Submission updated successfully!' });
      } else {
        await apiService.submitForm(formData);
        setSubmitMessage({ type: 'success', text: 'Form submitted successfully!' });
      }

      setFormData({ name: '', email: '', message: '' });
      if (onSubmitSuccess) onSubmitSuccess();
      if (isEditMode && onCancelEdit) onCancelEdit();
    } catch (error: any) {
      if (error.status === 409 && onError) {
        onError("This email address is already in use. Please use a different one or edit your existing submission.");
      } else {
        setSubmitMessage({ type: 'error', text: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-header">
        <h2 className="form-title">{isEditMode ? 'Edit Submission' : 'Submit a Form'}</h2>
        {isEditMode && onCancelEdit && (
          <button type="button" className="cancel-button" onClick={onCancelEdit}>Cancel</button>
        )}
      </div>

      <FormField label="Name" name="name" type="text" value={formData.name} onChange={handleChange} error={errors.name} required />
      <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
      <FormField label="Message" name="message" type="textarea" value={formData.message} onChange={handleChange} error={errors.message} required rows={5} />

      {submitMessage && (
        <div className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</div>
      )}

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update' : 'Submit')}
      </button>
    </form>
  );
};