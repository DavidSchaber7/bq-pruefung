import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getQuestions, getSubject } from '../data/subjects';
import {
  saveAnswer,
  setCurrentIndex,
  getBookmarks,
  toggleBookmark,
  getProgress,
} from '../utils/storage';
import QuestionCard from '../components/QuestionCard';
import { useTheme } from '../utils/theme';

export default function LearnScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { subjectId, startIndex = 0, filterMode, filterTopic } = route.params;
  const subject = getSubject(subjectId);
  const allQuestions = getQuestions(subjectId);

  const [progress, setProgress] = useState({ answered: {} });
  const [bookmarks, setBookmarks] = useState([]);
  const [currentIndex, setIndex] = useState(0);

  // Filter questions based on mode
  const questions = useMemo(() => {
    if (filterMode === 'wrong') {
      return allQuestions.filter((q) => progress.answered[q.id] === false);
    }
    if (filterMode === 'topic' && filterTopic) {
      return allQuestions.filter((q) => q.topic === filterTopic);
    }
    return allQuestions;
  }, [filterMode, filterTopic, allQuestions, progress.answered]);

  useFocusEffect(
    useCallback(() => {
      getBookmarks().then(setBookmarks);
      getProgress().then((p) => {
        setProgress(p[subjectId] || { answered: {}, currentIndex: 0 });
        // Set start index for normal mode
        if (!filterMode) {
          setIndex(startIndex);
        }
      });
    }, [subjectId])
  );

  const handleAnswer = async (questionId, isCorrect) => {
    await saveAnswer(subjectId, questionId, isCorrect);
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const Haptics = require('expo-haptics');
        if (isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {}
    }
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      const title = filterMode === 'wrong'
        ? 'Alle Fehler wiederholt!'
        : filterMode === 'topic'
        ? `${filterTopic} abgeschlossen!`
        : 'Geschafft!';
      Alert.alert(
        title,
        `Du hast alle ${questions.length} Fragen durchgearbeitet!`,
        [{ text: 'Zurück', onPress: () => navigation.goBack() }]
      );
      return;
    }
    setIndex(nextIndex);
    if (!filterMode) {
      await setCurrentIndex(subjectId, nextIndex);
    }
  };

  const handleBookmark = async (questionId) => {
    const updated = await toggleBookmark(questionId);
    setBookmarks(updated);
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyText}>
            {filterMode === 'wrong'
              ? 'Keine falschen Fragen! Alles richtig gemacht.'
              : 'Keine Fragen verfügbar.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!questions[currentIndex]) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyText}>Laden...</Text>
      </SafeAreaView>
    );
  }

  // Header label
  const modeLabel = filterMode === 'wrong'
    ? '🔄 Fehler wiederholen'
    : filterMode === 'topic'
    ? `📂 ${filterTopic}`
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {modeLabel && (
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>{modeLabel}</Text>
        </View>
      )}
      <QuestionCard
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBookmark={handleBookmark}
        isBookmarked={bookmarks.includes(questions[currentIndex].id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  modeBadge: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modeBadgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
