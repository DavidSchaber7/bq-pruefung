import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSubject, getQuestions } from '../data/subjects';
import { getProgress, getSRS, getSRSStats, getWeaknessAnalysis } from '../utils/storage';
import { useTheme } from '../utils/theme';

const SUBJECT_COLORS = { rbh: '#4A90D9', bwh: '#27AE60', ikp: '#F39C12', zib: '#8E44AD', ntg: '#E74C3C' };

export default function SubjectScreen({ route, navigation }) {
  const { colors, dark } = useTheme();
  const { subjectId } = route.params;
  const subject = getSubject(subjectId);
  const questions = getQuestions(subjectId);
  const subColor = SUBJECT_COLORS[subjectId] || '#4A90D9';
  const [progress, setProgress] = useState({ answered: {}, currentIndex: 0 });
  const [srs, setSrs] = useState({});
  const [weaknesses, setWeaknesses] = useState([]);

  useFocusEffect(useCallback(() => {
    getProgress().then((p) => {
      const sp = p[subjectId] || { answered: {}, currentIndex: 0 };
      setProgress(sp);
      setWeaknesses(getWeaknessAnalysis(questions, sp));
    });
    getSRS().then(setSrs);
  }, [subjectId]));

  const answered = Object.keys(progress.answered).length;
  const correct = Object.values(progress.answered).filter(Boolean).length;
  const wrong = answered - correct;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const percent = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;
  const srsStats = getSRSStats(questions, srs);
  const wrongIds = Object.entries(progress.answered).filter(([_, v]) => !v).map(([k]) => k);
  const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))].sort();

  const card = [styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Stats header */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
          <View style={styles.statsTop}>
            <View style={[styles.percentCircle, { borderColor: subColor }]}>
              <Text style={[styles.percentText, { color: subColor }]}>{percent}%</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.text }]}>{answered}<Text style={{ color: colors.textSecondary, fontSize: 14 }}>/{questions.length}</Text></Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bearbeitet</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.correctGreen }]}>{correct}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Richtig</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.wrongRed }]}>{wrong}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Falsch</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.gold }]}>{srsStats.mastered}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gemeistert</Text>
              </View>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
            <View style={[styles.progressFill, { width: `${Math.max(percent, 0.5)}%`, backgroundColor: subColor }]} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Action Buttons */}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: subColor }]}
            onPress={() => navigation.navigate('Learn', { subjectId, startIndex: progress.currentIndex || 0 })} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Lernmodus starten</Text>
              <Text style={styles.actionDesc}>Alle {questions.length} Fragen durcharbeiten</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4A90D9' }]}
            onPress={() => navigation.navigate('Exam', { subjectId })} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Prüfung simulieren</Text>
              <Text style={styles.actionDesc}>30 Fragen · 45 Minuten</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {wrongIds.length > 0 && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.wrongRed }]}
              onPress={() => navigation.navigate('Learn', { subjectId, startIndex: 0, filterMode: 'wrong' })} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Fehler wiederholen</Text>
                <Text style={styles.actionDesc}>{wrongIds.length} falsche Fragen</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Topics */}
          {topics.length > 1 && (
            <>
              <Text style={[styles.section, { color: colors.textSecondary }]}>Themen</Text>
              {topics.map((topic) => {
                const tq = questions.filter((q) => q.topic === topic);
                const ta = tq.filter((q) => progress.answered[q.id] !== undefined).length;
                const tc = tq.filter((q) => progress.answered[q.id] === true).length;
                const acc = ta > 0 ? Math.round((tc / ta) * 100) : -1;
                const tPct = Math.round((ta / tq.length) * 100);
                return (
                  <TouchableOpacity key={topic} style={card}
                    onPress={() => navigation.navigate('Learn', { subjectId, startIndex: 0, filterMode: 'topic', filterTopic: topic })} activeOpacity={0.65}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.topicName, { color: colors.text }]}>{topic}</Text>
                      <Text style={[styles.topicMeta, { color: acc >= 0 ? (acc >= 70 ? colors.correctGreen : acc >= 40 ? colors.gold : colors.wrongRed) : colors.textSecondary }]}>
                        {acc >= 0 ? `${acc}%` : `${tq.length}`}
                      </Text>
                    </View>
                    <View style={[styles.topicTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
                      <View style={[styles.topicFill, { width: `${Math.max(tPct, 0.5)}%`, backgroundColor: subColor + '80' }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Weakness */}
          {weaknesses.some((w) => w.accuracy >= 0) && (
            <>
              <Text style={[styles.section, { color: colors.textSecondary }]}>Schwächste Themen</Text>
              {weaknesses.filter((w) => w.accuracy >= 0).slice(0, 3).map((w) => (
                <View key={w.topic} style={card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.topicName, { color: colors.text }]}>{w.topic}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: w.accuracy >= 70 ? colors.correctGreen : w.accuracy >= 40 ? colors.gold : colors.wrongRed }}>{w.accuracy}%</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsCard: { margin: 16, borderRadius: 16, padding: 20, borderWidth: 1 },
  statsTop: { flexDirection: 'row', alignItems: 'center' },
  percentCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  percentText: { fontSize: 24, fontWeight: '800' },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statItem: { width: '45%', marginBottom: 4 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 1 },
  progressTrack: { height: 6, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  actionBtn: { borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  actionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionArrow: { fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: '300', marginLeft: 12 },

  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },

  card: { borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1 },
  topicName: { fontSize: 15, fontWeight: '600' },
  topicMeta: { fontSize: 15, fontWeight: '800' },
  topicTrack: { height: 4, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: 2 },
});
