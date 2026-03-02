import React from 'react'
import { Check, ArrowRight } from 'lucide-react'

interface RegistrationSuccessModalProps {
  email: string
  onClose: () => void
}

export default function RegistrationSuccessModal({ email, onClose }: RegistrationSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] text-white rounded-3xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden shadow-2xl border border-gray-800">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-green-500/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                <Check className="text-white w-8 h-8 stroke-[3]" />
              </div>
            </div>
          </div>
        </div>

        {/* Success Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wider flex items-center gap-1">
            <span className="text-[10px]">✦</span> SUCCESS
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-2">
          Account <span className="text-green-400">Created!</span>
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center text-sm mb-8 px-2">
          Your account has been successfully created.
          <br />
          A confirmation link has been sent to
          <br />
          <span className="text-white font-medium">{email}</span>
        </p>

        {/* Steps */}
        <div className="space-y-6 mb-8 pl-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-green-500/20"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Account created</h3>
              <p className="text-gray-500 text-xs">Your profile is ready to go</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-700"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Email confirmed</h3>
              <p className="text-gray-500 text-xs">Your email address has been verified</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-400 text-sm">Set up your profile</h3>
              <p className="text-gray-600 text-xs">Complete your personal information</p>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-lg shadow-green-500/20"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
