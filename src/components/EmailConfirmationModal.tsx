import React from 'react'
import { Mail, X } from 'lucide-react'

interface EmailConfirmationModalProps {
  email: string
  onContinue: () => void
  onClose: () => void
}

export default function EmailConfirmationModal({ email, onContinue, onClose }: EmailConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-green-100">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="bg-gradient-to-r from-green-500 to-green-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
            <Mail className="text-white" size={36} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Confirm Your Email
          </h2>
          
          <p className="text-gray-600 mb-6 px-2">
            We've sent a confirmation link to<br/>
            <span className="text-green-600 font-bold text-lg break-all">{email}</span>
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <p className="text-green-800 text-sm font-medium flex items-center justify-center gap-2">
              <span>📧</span>
              Click the link in your email to activate your account.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Continue to Sign In
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all duration-200"
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
