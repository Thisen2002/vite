type Row = Record<string, string | number | boolean | null | undefined>;

export function exportToCsv(filename: string, rows: Row[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: string | number | boolean | null | undefined) => {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.join(',')]
    .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
