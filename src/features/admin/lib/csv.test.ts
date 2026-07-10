import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCsv } from './csv';

describe('exportCsv', () => {
  let capturedBlob: Blob | null;
  let clickSpy: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    capturedBlob = null;
    clickSpy = vi.fn();
    globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:fake';
    });
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => clickSpy());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const readBlob = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });

  it('does nothing for empty rows', () => {
    exportCsv('empty', []);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('writes headers from the first row and triggers a download', async () => {
    exportCsv('travelers', [{ name: 'Basem', bookings: 3 }]);
    expect(clickSpy).toHaveBeenCalledOnce();
    const text = await readBlob(capturedBlob!);
    expect(text).toContain('name,bookings');
    expect(text).toContain('Basem,3');
  });

  it('escapes commas, quotes and newlines', async () => {
    exportCsv('x', [{ a: 'hello, world', b: 'say "hi"', c: 'line1\nline2' }]);
    const text = await readBlob(capturedBlob!);
    expect(text).toContain('"hello, world"');
    expect(text).toContain('"say ""hi"""');
    expect(text).toContain('"line1\nline2"');
  });

  it('renders null and undefined as empty strings', async () => {
    exportCsv('x', [{ a: null, b: undefined, c: 0 }]);
    const text = await readBlob(capturedBlob!);
    expect(text.split('\r\n')[1]).toBe(',,0');
  });

  it('prepends a UTF-8 BOM so Excel renders Arabic', async () => {
    exportCsv('x', [{ a: 'الرياض' }]);
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(capturedBlob!);
    });
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    const text = await readBlob(capturedBlob!);
    expect(text).toContain('الرياض');
  });

  it('appends .csv to the filename when missing', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    exportCsv('report-2026', [{ a: 1 }]);
    const link = appendSpy.mock.calls.at(-1)?.[0] as HTMLAnchorElement;
    expect(link.download).toBe('report-2026.csv');
  });
});
