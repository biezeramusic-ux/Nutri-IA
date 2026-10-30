import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { tr } from '../i18n';
import type { WidgetSnapshot } from './widgetData';

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Widget pequeno: água de hoje com barra e atalho para registar. */
export function WaterWidget({ snapshot, width, dark = false }: { snapshot: WidgetSnapshot | null; width: number; dark?: boolean }) {
  const bg = dark ? '#171717' : '#FFFFFF';
  const text = dark ? '#F8FAFC' : '#0F172A';
  const muted = dark ? '#A3A3A3' : '#64748B';
  const track = dark ? '#2E2E2E' : '#E0F2FE';
  const drank = snapshot?.waterMl ?? 0;
  const goal = snapshot?.goalWaterMl ?? 2500;
  const barW = Math.max(100, width - 40);
  const fill = Math.max(8, Math.round(barW * Math.min(1, drank / Math.max(1, goal))));

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ width: 'match_parent', height: 'match_parent', backgroundColor: bg, borderRadius: 26, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <TextWidget text={`💧 ${tr('Água')}`} style={{ fontSize: 14, fontWeight: '700', color: text }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <TextWidget text={fmt(drank)} style={{ fontSize: 30, fontWeight: '800', color: text }} />
          <TextWidget text={` / ${fmt(goal)} ml`} style={{ fontSize: 12, color: muted, marginBottom: 5 }} />
        </FlexWidget>
        <FlexWidget style={{ width: barW, height: 8, borderRadius: 4, backgroundColor: track, marginTop: 4 }}>
          <FlexWidget style={{ width: fill, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' }} />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'nutrifitness://water' }}
        style={{ height: 30, borderRadius: 15, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center' }}
      >
        <TextWidget text={`+ ${tr('Registrar água')}`} style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
