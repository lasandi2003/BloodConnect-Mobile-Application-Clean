import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

const steps = ['Patient', 'Hospital', 'Review'];

export default function RequestProgress({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <View style={styles.progress} accessible accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: 3, now: activeStep, text: `Step ${activeStep} of 3: ${steps[activeStep - 1]}` }}>
      <View style={styles.heading}>
        <Text style={styles.title}>Request progress</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Step {activeStep} of 3</Text></View>
      </View>
      <View style={styles.track}>
        <View style={styles.line} />
        {steps.map((step, index) => {
          const active = index + 1 === activeStep;
          const complete = index + 1 < activeStep;
          return (
            <View key={step} style={styles.step}>
              <View style={[styles.halo, active && styles.activeHalo]}>
                <View style={[styles.circle, active && styles.activeCircle, complete && styles.completeCircle]}>
                  {complete ? <Ionicons name="checkmark" size={19} color={COLORS.white} />
                    : <Text style={[styles.number, active && styles.activeNumber]}>{index + 1}</Text>}
                </View>
              </View>
              <Text style={[styles.label, active && styles.activeLabel, complete && styles.completeLabel]}>{step}</Text>
              <Text style={styles.status}>{complete ? 'Completed' : active ? 'In progress' : 'Upcoming'}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { marginBottom: 26, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18,
    backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.softBackground },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  track: { flexDirection: 'row', marginTop: 16 },
  line: { position: 'absolute', top: 21, left: '16.67%', right: '16.67%', height: 2,
    borderRadius: 1, backgroundColor: COLORS.border },
  step: { flex: 1, alignItems: 'center' },
  halo: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  activeHalo: { backgroundColor: COLORS.primaryLight },
  circle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground, alignItems: 'center', justifyContent: 'center' },
  activeCircle: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  completeCircle: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  number: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  activeNumber: { color: COLORS.white },
  label: { marginTop: 8, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  activeLabel: { color: COLORS.primary, fontWeight: '800' },
  completeLabel: { color: COLORS.success },
  status: { marginTop: 4, fontSize: 10, color: COLORS.textSecondary },
});
