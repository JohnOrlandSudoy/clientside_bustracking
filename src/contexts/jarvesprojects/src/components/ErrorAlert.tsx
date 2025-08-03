import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  return (
    <div className="mb-4 bg-pink-50 border border-pink-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-pink-600 mr-2" />
        <span className="text-pink-800">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-pink-600 hover:text-pink-800 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};