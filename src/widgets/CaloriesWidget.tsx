import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { tr } from '../i18n';
import type { WidgetSnapshot } from './widgetData';

const SIZE = 112;
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function ring(progress: number, track: string): string {
  const r = 42;
  const c = 2 * Math.PI * r;
  const p = Math.max(0.001, Math.min(1, progress));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="#16A34A"/></linearGradient></defs>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${track}" stroke-width="9"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>
  </svg>`;
}

/** Widget pequeno: anel com as calorias que faltam e atalho para registar. */
export function CaloriesWidget({ snapshot, dark = false }: { snapshot: WidgetSnapshot | null; width: number; dark?: boolean }) {
  const s = snapshot;
  const bg = dark ? '#171717' : '#FFFFFF';
  const text = dark ? '#F8FAFC' : '#0F172A';
  const muted = dark ? '#A3A3A3' : '#64748B';
  const track = dark ? '#2E2E2E' : '#E8EEF4';
  const left = s ? Math.max(0, s.goalKcal - s.kcal) : 0;
  const progress = s && s.goalKcal > 0 ? s.kcal / s.goalKcal : 0;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ width: 'match_parent', height: 'match_parent', backgroundColor: bg, borderRadius: 26, padding: 10, alignItems: 'center', justifyContent: 'center' }}
    >
      <OverlapWidget style={{ width: SIZE, height: SIZE }}>
        <SvgWidget svg={ring(progress, track)} style={{ width: SIZE, height: SIZE }} />
        <FlexWidget style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text={fmt(left)} style={{ fontSize: 26, fontWeight: '800', color: text }} />
          <TextWidget text={`kcal ${tr('Restante').toLowerCase()}`} style={{ fontSize: 10, color: muted }} />
        </FlexWidget>
      </OverlapWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'nutrifitness://scanner' }}
        style={{ height: 28, borderRadius: 14, backgroundColor: '#FBBF24', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
      >
        <TextWidget text={`+ ${tr('Adicionar alimento')}`} style={{ fontSize: 11, fontWeight: '700', color: '#0F172A' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
