import { SOURCES, STATUSES } from './constants.js';

// Mirrors server/src/validation.js so users get instant feedback.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,18}$/;

export function validateLead(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Name is required';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!f.phone.trim()) e.phone = 'Phone is required';
  else if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number (7–15 digits)';
  if (!f.company.trim()) e.company = 'Company is required';
  if (!SOURCES.includes(f.source)) e.source = 'Choose a source';
  if (!STATUSES.includes(f.status)) e.status = 'Choose a status';
  return e;
}

export function validateAuth(f, isSignup) {
  const e = {};
  if (isSignup && !f.name.trim()) e.name = 'Name is required';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!f.password) e.password = 'Password is required';
  else if (isSignup && f.password.length < 8) e.password = 'Password must be at least 8 characters';
  return e;
}
