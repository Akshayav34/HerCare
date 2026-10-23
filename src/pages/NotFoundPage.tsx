import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 fill-rosepink-200 text-teal-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Page Not Found (404)
      </h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        The healthcare page or medical route you requested does not exist or has been relocated.
      </p>
      <div className="flex gap-3">
        <Link to="/dashboard">
          <Button variant="primary" size="md">
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="md">
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
