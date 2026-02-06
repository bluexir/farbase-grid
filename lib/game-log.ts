/**
 * Oyun olay logları - Skor doğrulama için
 * Client'tan gelen logları sunucuda replay ederek skoru doğrular
 */

export interface GameEvent {
  type: 'DROP' | 'MERGE';
  timestamp: number;
  data: {
    x?: number;
    level?: number;
    fromLevel?: number;
    toLevel?: number;
  };
}

export interface GameLog {
  sessionId: string;
  fid: number;
  mode: 'practice' | 'tournament';
  startTime: number;
  endTime?: number;
  events: GameEvent[];
  finalScore?: number;
  mergeCount?: number;
  highestLevel?: number;
}

export function calculateScoreFromLog(log: GameLog): {
  score: number;
  mergeCount: number;
  highestLevel: number;
  isValid: boolean;
} {
  let mergeCount = 0;
  let highestLevel = 1;
  
  for (const event of log.events) {
    if (event.type === 'MERGE') {
      mergeCount++;
      if (event.data.toLevel && event.data.toLevel > highestLevel) {
        highestLevel = event.data.toLevel;
      }
    }
  }

  const scoreValue = getScoreValueByLevel(highestLevel);
  const score = scoreValue * mergeCount;

  const isValid = 
    log.finalScore === score &&
    log.mergeCount === mergeCount &&
    log.highestLevel === highestLevel;

  return { score, mergeCount, highestLevel, isValid };
}

function getScoreValueByLevel(level: number): number {
  const values: Record<number, number> = {
    1: 1,
    2: 2,
    3: 4,
    4: 8,
    5: 16,
    6: 32,
    7: 64,
    8: 128,
  };
  return values[level] || 1;
}

export function validateGameLog(log: GameLog): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!log.sessionId) errors.push('Missing sessionId');
  if (!log.fid) errors.push('Missing fid');
  if (!log.mode || !['practice', 'tournament'].includes(log.mode)) {
    errors.push('Invalid mode');
  }
  if (!Array.isArray(log.events)) errors.push('Invalid events array');
  if (log.events.length === 0) errors.push('Empty events');
  
  if (log.startTime && log.endTime) {
    const duration = log.endTime - log.startTime;
    if (duration > 30 * 60 * 1000) {
      errors.push('Game duration too long');
    }
    if (duration < 5000) {
      errors.push('Game duration too short');
    }
  }

  let lastTimestamp = log.startTime;
  for (const event of log.events) {
    if (event.timestamp < lastTimestamp) {
      errors.push('Event timestamp out of order');
      break;
    }
    lastTimestamp = event.timestamp;
    
    if (event.type === 'DROP') {
      if (typeof event.data.x !== 'number' || event.data.x < 0 || event.data.x > 424) {
        errors.push('Invalid drop position');
      }
      if (!event.data.level || event.data.level < 1 || event.data.level > 3) {
        errors.push('Invalid drop level');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
