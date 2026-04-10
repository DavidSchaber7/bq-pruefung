import rbhData from '../../public/data/rbh.json';
import bwhData from '../../public/data/bwh.json';
import ikpData from '../../public/data/ikp.json';
import zibData from '../../public/data/zib.json';
import ntgData from '../../public/data/ntg.json';

export const SUBJECTS = [
  { id: 'rbh', name: 'Rechtsbewusstes Handeln', icon: '⚖️', color: '#3B82F6' },
  { id: 'bwh', name: 'Betriebswirtschaftliches Handeln', icon: '📊', color: '#10B981' },
  { id: 'ikp', name: 'Information, Kommunikation, Planung', icon: '💬', color: '#F59E0B' },
  { id: 'zib', name: 'Zusammenarbeit im Betrieb', icon: '🤝', color: '#8B5CF6' },
  { id: 'ntg', name: 'Naturwiss. & techn. Gesetzmäßigkeiten', icon: '🔬', color: '#EF4444' },
];

const DATA_MAP = {
  rbh: rbhData,
  bwh: bwhData,
  ikp: ikpData,
  zib: zibData,
  ntg: ntgData,
};

export function getQuestions(subjectId) {
  return DATA_MAP[subjectId]?.questions || [];
}

export function getSubject(subjectId) {
  return SUBJECTS.find((s) => s.id === subjectId);
}
