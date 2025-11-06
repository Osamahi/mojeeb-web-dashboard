/**
 * Minimal Auth Footer Link Component
 * Used for navigation between auth pages (login/signup)
 */

import { Link } from 'react-router-dom';

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  linkTo: string;
}

export const AuthFooterLink = ({ text, linkText, linkTo }: AuthFooterLinkProps) => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-neutral-600">
        {text}{' '}
        <Link
          to={linkTo}
          className="text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium"
        >
          {linkText}
        </Link>
      </p>
    </div>
  );
};
