import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';
import CentreMapCanvas from './CentreMapCanvas';
import { centreMapHtml, validMapCoordinates, type MapCoordinates } from './centreMapHtml';
interface Props { initial: MapCoordinates | null; onSelect: (point: MapCoordinates) => void; onCancel: () => void }
export default function CentreLocationPicker({ initial, onSelect, onCancel }: Props) {
  const [point, setPoint] = useState<MapCoordinates | null>(validMapCoordinates(initial) ? initial : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Keep the map document stable when selecting a point.
  const [html] = useState(() => centreMapHtml(initial));
  const fail = useCallback(() => { setLoading(false); setError(true); }, []);
  const receive = useCallback((message: string) => {
    try {
      const data = JSON.parse(message);
      if (data?.type === 'selection' && validMapCoordinates(data)) setPoint({ latitude: data.latitude, longitude: data.longitude });
      else if (data?.type === 'ready') { setLoading(false); setError(false); }
      else if (data?.type === 'error') fail();
    } catch { /* Ignore malformed map messages. */ }
  }, [fail]);
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(fail, 20000);
    return () => clearTimeout(timeout);
  }, [loading, fail]);
  const coordinates = useMemo(() => point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'No location selected', [point]);
  return <View style={styles.root}>
    <Text style={styles.title}>Select Location on Map</Text><Text style={styles.text}>Zoom in and tap the centre’s exact location. Drag the pin to adjust.</Text>
    <View style={styles.map}><CentreMapCanvas html={html} onMessage={receive} onError={fail} /></View>
    {loading && <ActivityIndicator color={COLORS.primary} accessibilityLabel="Loading map" />}
    {error && <Text style={styles.error}>Map could not load. Check your connection or use manual coordinate entry.</Text>}
    <Text selectable style={styles.text} accessibilityLiveRegion="polite">Selected coordinates: {coordinates}</Text>
    <View style={styles.actions}><Pressable style={styles.cancel} onPress={onCancel} accessibilityRole="button"><Text style={styles.text}>Back to Form</Text></Pressable><Pressable disabled={!point || loading || error} style={[styles.confirm, (!point || loading || error) && styles.disabled]} onPress={() => { if (point) onSelect(point); }} accessibilityRole="button"><Text style={styles.white}>Use This Location</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 50, paddingBottom: 30, gap: 12 }, title: { color: COLORS.text, fontSize: 22, fontWeight: '700' }, text: { color: COLORS.textSecondary, lineHeight: 21 }, map: { flex: 1, minHeight: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }, error: { color: COLORS.danger }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, confirm: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, minHeight: 48 }, cancel: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, minHeight: 48, borderColor: COLORS.border, borderWidth: 1 }, white: { color: COLORS.white, fontWeight: '700' }, disabled: { opacity: 0.45 },
});
