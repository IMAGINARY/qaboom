const SCORE_KEY = "scores";

interface Score {
  name: string;
  score: number;
}

const initialScores: Score[] = [
  { name: "CAT", score: 200000 },
  { name: "NAT", score: 150000 },
  { name: "QBT", score: 120000 },
  { name: "BIT", score: 100000 },
  { name: "BRA", score: 90000 },
  { name: "KET", score: 80000 },
  { name: "HAD", score: 70000 },
  { name: "ENT", score: 60000 },
];

export function getScores() {
  const scores = localStorage.getItem(SCORE_KEY);
  return scores ? (JSON.parse(scores) as Score[]) : initialScores;
}

export function setScores(scores: Score[]) {
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}
