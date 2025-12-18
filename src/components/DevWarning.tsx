import React from 'react';

export const DevWarning: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 fixed bottom-4 right-4 max-w-xs rounded shadow-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Development Mode: Using localhost:3000
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevWarning;