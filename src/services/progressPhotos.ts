import { Directory, File, Paths } from 'expo-file-system';

/** Fotos de progresso: ficam só no telemóvel (não vão para a nuvem). */
const dir = () => new Directory(Paths.document, 'progress-photos');

export interface ProgressPhoto {
  uri: string;
  name: string;
  takenAt: number;
}

export function listProgressPhotos(): ProgressPhoto[] {
  try {
    const d = dir();
    if (!d.exists) return [];
    return d
      .list()
      .filter((e): e is File => e instanceof File && e.name.endsWith('.jpg'))
      .map((f) => ({ uri: f.uri, name: f.name, takenAt: Number(f.name.replace('.jpg', '')) || 0 }))
      .sort((a, b) => b.takenAt - a.takenAt);
  } catch {
    return [];
  }
}

export function saveProgressPhoto(sourceUri: string): ProgressPhoto | null {
  try {
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    const takenAt = Date.now();
    const dest = new File(d, `${takenAt}.jpg`);
    new File(sourceUri).copy(dest, { overwrite: true });
    return { uri: dest.uri, name: dest.name, takenAt };
  } catch {
    return null;
  }
}

export function deleteProgressPhoto(name: string): void {
  try {
    const f = new File(dir(), name);
    if (f.exists) f.delete();
  } catch {
    // ignora
  }
}
