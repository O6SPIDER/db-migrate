import { describe, it, expect } from 'vitest';
import { redactUrl, detectProviderFromUrl, isPooledUrl } from './redaction';

describe('Frontend Redaction & Provider Detection Utilities', () => {
  it('redacts password from postgresql URL', () => {
    const raw = 'postgresql://admin_user:SuperSecret123@ep-example.aws.neon.tech/neondb?sslmode=require';
    const redacted = redactUrl(raw);
    expect(redacted).not.toContain('SuperSecret123');
    expect(redacted).toContain('postgresql://admin_user:••••••••@ep-example.aws.neon.tech/neondb');
  });

  it('redacts password from postgres scheme URL', () => {
    const raw = 'postgres://john_doe:MyP%40ssw0rd!@localhost:5432/my_db';
    const redacted = redactUrl(raw);
    expect(redacted).not.toContain('MyP%40ssw0rd!');
    expect(redacted).toContain('postgres://john_doe:••••••••@localhost:5432/my_db');
  });

  it('detects Neon provider', () => {
    const url = 'postgresql://user:pass@ep-[#id].aws.neon.tech/neondb';
    expect(detectProviderFromUrl(url)).toBe('Neon');
  });

  it('detects Supabase provider', () => {
    const url = 'postgresql://user:pass@db.[ref].supabase.co:5432/postgres';
    expect(detectProviderFromUrl(url)).toBe('Supabase');
  });

  it('detects pooled connection endpoints', () => {
    const pooledUrl = 'postgresql://user:pass@ep-[#id]-pooler.aws.neon.tech/neondb';
    const directUrl = 'postgresql://user:pass@ep-[#id].aws.neon.tech/neondb';

    expect(isPooledUrl(pooledUrl)).toBe(true);
    expect(isPooledUrl(directUrl)).toBe(false);
  });
});
