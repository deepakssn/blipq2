import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email address'; // Get email from navigation state if passed

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <div className="bg-white p-8 sm:p-12 rounded-lg shadow-md w-full max-w-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-green-500 mx-auto mb-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12.586l4.25 2.833M12 12.586L7.75 15.42M12 12.586V19M12 12.586V6.414A2 2 0 0112.89 4.75l.11.065" />
        </svg>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6 text-base sm:text-lg">
          A verification link has been sent to <strong className="text-gray-700">{email}</strong>.
          Please check your inbox (and spam folder) and click on the link to complete your registration.
        </p>
        <p className="text-gray-600 mb-8 text-sm">
          Didn't receive the email?{' '}
          <button
            // onClick={handleResendVerification} // Add resend logic later
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Resend verification email
          </button>
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-150"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
