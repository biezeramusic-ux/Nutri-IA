import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { tr } from '../i18n';
import type { WidgetSnapshot } from './widgetData';

interface Props {
  snapshot: WidgetSnapshot | null;
  /** Largura do widget em dp. */
  width: number;
  dark?: boolean;
}

const RING = 104;

function ringSvg(progress: number, color: string, track: string): string {
  const r = 42;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${RING}" height="${RING}" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${track}" stroke-width="10"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>
  </svg>`;
}

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Widget "Nutrição do dia": calorias restantes, macros e botão para adicionar um alimento. */
export function NutritionWidget({ snapshot, width, dark = false }: Props) {
  const s = snapshot;
  const bg = dark ? '#171717' : '#FFFFFF';
  const text = dark ? '#F8FAFC' : '#0F172A';
  const muted = dark ? '#A3A3A3' : '#64748B';
  const track = dark ? '#2E2E2E' : '#E2E8F0';

  const goalKcal = s?.goalKcal ?? 0;
  const left = s ? Math.max(0, s.goalKcal - s.kcal) : 0;
  const progress = s && s.goalKcal > 0 ? s.kcal / s.goalKcal : 0;
  const rightW = Math.max(120, width - 28 - RING - 14);

  const macros: { label: string; value: number; goal: number; color: `#${string}` }[] = [
    { label: tr('Proteínas'), value: s?.proteinG ?? 0, goal: s?.goalProteinG ?? 1, color: '#4C9AFF' },
    { label: tr('Gorduras'), value: s?.fatsG ?? 0, goal: s?.goalFatsG ?? 1, color: '#F472B6' },
    { label: tr('Carboidratos'), value: s?.carbsG ?? 0, goal: s?.goalCarbsG ?? 1, color: '#F5A524' },
  ];

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ width: 'match_parent', height: 'match_parent', backgroundColor: bg, borderRadius: 24, padding: 14, flexDirection: 'column' }}
    >
      <TextWidget text={`🔥 ${tr('Nutrição do dia')}`} style={{ fontSize: 14, fontWeight: '700', color: text }} />
      <FlexWidget style={{ width: 'match_parent', flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <FlexWidget style={{ width: RING, flexDirection: 'column', alignItems: 'center' }}>
          <OverlapWidget style={{ width: RING, height: RING }}>
            <SvgWidget svg={ringSvg(progress, '#4CAF50', track)} style={{ width: RING, height: RING }} />
            <FlexWidget style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
              <TextWidget text={tr('Restante')} style={{ fontSize: 11, color: muted }} />
              <TextWidget text={fmt(left)} style={{ fontSize: 24, fontWeight: '800', color: text }} />
              <TextWidget text="kcal" style={{ fontSize: 11, color: muted }} />
            </FlexWidget>
          </OverlapWidget>
          <TextWidget text={`${tr('Objetivo')}: ${fmt(goalKcal)}`} style={{ fontSize: 11, color: muted, marginTop: 2 }} />
        </FlexWidget>

        <FlexWidget style={{ width: rightW, marginLeft: 14, flexDirection: 'column' }}>
          {macros.map((m) => (
            <FlexWidget key={m.label} style={{ width: rightW, flexDirection: 'column', marginBottom: 5 }}>
              <FlexWidget style={{ width: rightW, flexDirection: 'row', alignItems: 'center' }}>
                <TextWidget text={m.label} style={{ fontSize: 12, fontWeight: '600', color: text }} />
                <FlexWidget style={{ flex: 1 }} />
                <TextWidget text={`${fmt(m.value)} g`} style={{ fontSize: 12, fontWeight: '700', color: text }} />
              </FlexWidget>
              <FlexWidget style={{ width: rightW, height: 5, borderRadius: 3, backgroundColor: track, marginTop: 2 }}>
                <FlexWidget style={{ width: Math.max(4, Math.round(rightW * Math.min(1, m.value / Math.max(1, m.goal)))), height: 5, borderRadius: 3, backgroundColor: m.color }} />
              </FlexWidget>
            </FlexWidget>
          ))}
          <FlexWidget
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'nutrifitness://scanner' }}
            style={{ width: rightW, height: 32, borderRadius: 16, backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}
          >
            <TextWidget text={`+ ${tr('Adicionar alimento')}`} style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }} />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
