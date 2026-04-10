import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'BQ Prüfung',
    subtitle: 'Deine Vorbereitung auf die\nIndustriemeister Prüfung',
    desc: '1000 Fragen in 5 Fächern.\nAlles was du zum Bestehen brauchst.',
    accent: '#4A90D9',
  },
  {
    title: 'Intelligent lernen',
    subtitle: 'Spaced Repetition',
    desc: 'Schwierige Fragen werden öfter wiederholt.\nGemeisterte Fragen seltener.\nWissenschaftlich bewiesen effektiv.',
    accent: '#8E44AD',
  },
  {
    title: 'Echte Prüfung',
    subtitle: '30 Fragen · 45 Minuten',
    desc: 'Simuliere die IHK-Prüfung unter\nrealistischen Bedingungen.\nMit detaillierter Auswertung.',
    accent: '#27AE60',
  },
  {
    title: 'Dranbleiben',
    subtitle: 'Tägliches Lernziel',
    desc: 'Setze dir ein Tagesziel und baue\neine Lernstreak auf.\nKontinuität schlägt Intensität.',
    accent: '#E74C3C',
  },
];

export default function OnboardingScreen({ onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else { finish(); }
  };

  const finish = async () => {
    await AsyncStorage.setItem('bq_onboarding_done', 'true');
    onDone();
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.accent, { backgroundColor: item.accent }]} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && [styles.dotActive, { backgroundColor: slide.accent }]]} />
          ))}
        </View>

        {!isLast && (
          <TouchableOpacity onPress={finish} style={styles.skip}>
            <Text style={styles.skipText}>Überspringen</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: slide.accent }]} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextText}>{isLast ? 'Los geht\'s' : 'Weiter'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  accent: { width: 60, height: 4, borderRadius: 2, marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#555', textAlign: 'center', marginTop: 12, lineHeight: 26 },
  desc: { fontSize: 15, color: '#999', textAlign: 'center', marginTop: 20, lineHeight: 24 },
  footer: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  dotActive: { width: 24 },
  skip: { alignItems: 'center', padding: 8 },
  skipText: { fontSize: 15, color: '#AAA' },
  nextBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  nextText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
