import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SUBJECTS, getQuestions } from '../data/subjects';
import { getProgress, getStreak, getSettings } from '../utils/storage';
import { useTheme } from '../utils/theme';

const SUBJECT_COLORS = { rbh: '#4A90D9', bwh: '#27AE60', ikp: '#F39C12', zib: '#8E44AD', ntg: '#E74C3C' };

export default function HomeScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [progress, setProgress] = useState({});
  const [streak, setStreak] = useState({ currentStreak: 0, todayCount: 0, dailyGoal: 10 });
  const [settings, setSettings] = useState({ examDate: null });

  useFocusEffect(useCallback(() => {
    getProgress().then(setProgress);
    getStreak().then(setStreak);
    getSettings().then(setSettings);
  }, []));

  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const s of SUBJECTS) {
    const sp = progress[s.id]?.answered || {};
    totalAnswered += Object.keys(sp).length;
    totalCorrect += Object.values(sp).filter(Boolean).length;
  }
  const totalPercent = Math.round((totalAnswered / 1000) * 100);

  const daysUntilExam = settings.examDate
    ? Math.max(0, Math.ceil((new Date(settings.examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>BQ Prüfung</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {totalAnswered > 0 ? `${totalAnswered} von 1000 Fragen bearbeitet` : 'Industriemeister Basisqualifikation'}
            </Text>
          </View>
          {streak.currentStreak > 0 && (
            <View style={[styles.streakPill, { backgroundColor: colors.streakOrange }]}>
              <Text style={styles.streakText}>{streak.currentStreak}</Text>
            </View>
          )}
        </View>

        {/* Overall Progress */}
        {totalAnswered > 0 && (
          <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
            <View style={styles.overallRow}>
              <View>
                <Text style={[styles.overallPercent, { color: colors.brand }]}>{totalPercent}%</Text>
                <Text style={[styles.overallLabel, { color: colors.textSecondary }]}>Gesamtfortschritt</Text>
              </View>
              <View style={styles.overallStats}>
                <View style={styles.overallStat}>
                  <Text style={[styles.overallStatNum, { color: colors.correctGreen }]}>{totalCorrect}</Text>
                  <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>richtig</Text>
                </View>
                <View style={styles.overallStat}>
                  <Text style={[styles.overallStatNum, { color: colors.wrongRed }]}>{totalAnswered - totalCorrect}</Text>
                  <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>falsch</Text>
                </View>
              </View>
            </View>
            <View style={[styles.overallTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
              <View style={[styles.overallFill, { width: `${Math.max(totalPercent, 1)}%`, backgroundColor: colors.brand }]} />
            </View>
            {/* Daily goal */}
            <View style={styles.dailyRow}>
              <Text style={[styles.dailyLabel, { color: colors.textSecondary }]}>Heute</Text>
              <View style={[styles.dailyTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
                <View style={[styles.dailyFill, { width: `${Math.min(100, (streak.todayCount / streak.dailyGoal) * 100)}%`, backgroundColor: colors.gold }]} />
              </View>
              <Text style={[styles.dailyCount, { color: colors.textSecondary }]}>{streak.todayCount}/{streak.dailyGoal}</Text>
            </View>
          </View>
        )}

        {/* Exam countdown */}
        {daysUntilExam !== null && (
          <View style={[styles.examBanner, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
            <Text style={[styles.examDays, { color: colors.wrongRed }]}>{daysUntilExam}</Text>
            <Text style={[styles.examLabel, { color: colors.textSecondary }]}>Tage bis zur Prüfung</Text>
          </View>
        )}

        {/* Section label */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Fächer</Text>

        {/* Subject Cards */}
        {SUBJECTS.map((subject) => {
          const subColor = SUBJECT_COLORS[subject.id];
          const questions = getQuestions(subject.id);
          const sp = progress[subject.id]?.answered || {};
          const answered = Object.keys(sp).length;
          const correct = Object.values(sp).filter(Boolean).length;
          const percent = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

          return (
            <TouchableOpacity
              key={subject.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}
              onPress={() => navigation.navigate('Subject', { subjectId: subject.id })}
              activeOpacity={0.65}
            >
              {/* Color accent bar */}
              <View style={[styles.accentBar, { backgroundColor: subColor }]} />
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{subject.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                    {answered > 0 ? `${answered} von ${questions.length} · ${correct} richtig` : `${questions.length} Fragen`}
                  </Text>
                  {/* Progress bar */}
                  <View style={[styles.cardTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
                    <View style={[styles.cardFill, { width: `${Math.max(percent, 0.5)}%`, backgroundColor: subColor }]} />
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardPercent, { color: percent > 0 ? subColor : colors.textSecondary }]}>{percent}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  streakPill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, minWidth: 36, alignItems: 'center' },
  streakText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  overallCard: { marginHorizontal: 16, borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 8 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overallPercent: { fontSize: 36, fontWeight: '800' },
  overallLabel: { fontSize: 13, marginTop: 2 },
  overallStats: { flexDirection: 'row', gap: 20, marginTop: 4 },
  overallStat: { alignItems: 'center' },
  overallStatNum: { fontSize: 20, fontWeight: '800' },
  overallStatLabel: { fontSize: 11, marginTop: 1 },
  overallTrack: { height: 8, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  overallFill: { height: '100%', borderRadius: 4 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  dailyLabel: { fontSize: 12, fontWeight: '600', marginRight: 10, minWidth: 38 },
  dailyTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  dailyFill: { height: '100%', borderRadius: 3 },
  dailyCount: { fontSize: 12, fontWeight: '700', minWidth: 32 },

  examBanner: { marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  examDays: { fontSize: 28, fontWeight: '800' },
  examLabel: { fontSize: 14 },

  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 20, marginTop: 18, marginBottom: 10 },

  card: { marginHorizontal: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  accentBar: { width: 4 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 3 },
  cardTrack: { height: 5, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  cardFill: { height: '100%', borderRadius: 3 },
  cardRight: { marginLeft: 16, alignItems: 'center', minWidth: 44 },
  cardPercent: { fontSize: 22, fontWeight: '800' },
});
