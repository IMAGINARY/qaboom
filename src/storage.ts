const SCORE_KEY = "scores";

interface Score {
  name: string;
  score: number;
}

const initialScores: Score[] = [
  { name: "CAT", score: 500000 },
  { name: "NAT", score: 400000 },
  { name: "QBT", score: 300000 },
  { name: "BIT", score: 200000 },
  { name: "BRA", score: 150000 },
  { name: "KET", score: 100000 },
  { name: "HAD", score: 75000 },
  { name: "ENT", score: 50000 },
];

export function getScores() {
  const scores = localStorage.getItem(SCORE_KEY);
  return scores ? (JSON.parse(scores) as Score[]) : initialScores;
}

export function setScores(scores: Score[]) {
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}
