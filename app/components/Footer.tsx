import { textMuted } from '@/lib/styles/shared-styles';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-12 py-8">
      <div className="max-w-container mx-auto">
        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-5 text-center">
          <p className={`text-sm ${textMuted} m-0`}>
            © MentorMatch - Eldar Gafarov & Roee Bar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}