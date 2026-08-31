export function redactUrl(urlStr: string): string {
  if (!urlStr) return '';
  return urlStr.replace(
    /(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi,
    '$1••••••••$3'
  );
}

export function detectProviderFromUrl(urlStr: string): string {
  if (!urlStr) return 'PostgreSQL';
  const lower = urlStr.toLowerCase();
  if (lower.includes('neon.tech')) return 'Neon';
  if (lower.includes('supabase.co') || lower.includes('supabase.com')) return 'Supabase';
  if (lower.includes('railway.app') || lower.includes('railway.internal')) return 'Railway';
  if (lower.includes('render.com')) return 'Render';
  if (lower.includes('rds.amazonaws.com')) return 'AWS RDS';
  if (lower.includes('postgres.database.azure.com')) return 'Azure Database for PostgreSQL';
  if (lower.includes('cloudsql') || lower.includes('google')) return 'Google Cloud SQL';
  if (lower.includes('db.ondigitalocean.com')) return 'DigitalOcean';
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) return 'Localhost / Custom';
  return 'PostgreSQL';
}

export function isPooledUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  const lower = urlStr.toLowerCase();
  return lower.includes('-pooler') || lower.includes('pooler.') || lower.includes('pgbouncer');
}
