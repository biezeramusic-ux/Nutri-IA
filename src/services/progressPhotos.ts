import { Directory, File, Paths } from 'expo-file-system';
import { downloadCloudImage, listCloudImages, removeCloudImage, uploadCloudImage } from './cloudImages';

/** Fotos de progresso: ficam no telemóvel e uma cópia de ~50 KB vai para a conta (privada). */
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
    void uploadCloudImage(`progress-${takenAt}.jpg`, dest.uri);
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
  void removeCloudImage(`progress-${name}`);
}

/** Telemóvel novo: descarrega as fotos de progresso que estão na conta e faltam aqui. */
export async function restoreProgressPhotos(): Promise<boolean> {
  let changed = false;
  try {
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    const have = new Set(listProgressPhotos().map((p) => p.name));
    for (const cloudName of await listCloudImages('progress-')) {
      const local = cloudName.replace('progress-', '');
      if (have.has(local)) continue;
      if (await downloadCloudImage(cloudName, new File(d, local))) changed = true;
    }
  } catch {
    // ignora
  }
  return changed;
}
