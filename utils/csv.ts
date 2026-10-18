import fs from 'fs';

// Quote a value only when it holds a comma, quote or newline
const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function writeCsv(filePath: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map((row) => row.map(escape).join(','));
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

export function readCsv(filePath: string): string[][] {
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (char === '"') inQuotes = false;
      else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ',') row.push(field), (field = '');
    else if (char === '\n') row.push(field), rows.push(row), (row = []), (field = '');
    else if (char !== '\r') field += char;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows;
}

// Local date as YYYY-MM-DD
export function todayStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
