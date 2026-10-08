import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  size: number;
  strokeWidth: number;
  /** 0 a 1. */
  progress: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color: colorProp,
  trackColor: trackProp,
  children,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const color = colorProp ?? colors.primary;
  const trackColor = trackProp ?? colors.border;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  svg: { position: 'absolute' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
