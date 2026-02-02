export interface CoinType {
  level: number;
  name: string;
  symbol: string;
  radius: number;
  color: string;
  glowColor: string;
  scoreValue: number;
  iconUrl: string;
  isSponsor?: boolean;
}

export const COINS: CoinType[] = [
  {
    level: 1,
    name: "Dogecoin",
    symbol: "DOGE",
    radius: 18,
    color: "#C3A634",
    glowColor: "#C3A63488",
    scoreValue: 1,
    iconUrl: "/doge-logo.jpg",
  },
  {
    level: 2,
    name: "Shiba Inu",
    symbol: "SHIB",
    radius: 26,
    color: "#FFA500",
    glowColor: "#FFA50088",
    scoreValue: 2,
    iconUrl: "/shıb-logo.png",
  },
  {
    level: 3,
    name: "Sponsor",
    symbol: "SPONSOR",
    radius: 35,
    color: "#FF6B6B",
    glowColor: "#FF6B6B88",
    scoreValue: 4,
    iconUrl: "", 
    isSponsor: true,
  },
  {
    level: 4,
    name: "Pepe",
    symbol: "PEPE",
    radius: 45,
    color: "#00C853",
    glowColor: "#00C85388",
    scoreValue: 8,
    iconUrl: "/pepe-logo.png",
  },
  {
    level: 5,
    name: "Solana",
    symbol: "SOL",
    radius: 56,
    color: "#9945FF",
    glowColor: "#9945FF88",
    scoreValue: 16,
    iconUrl: "/sol-logo.png",
  },
  {
    level: 6,
    name: "Ethereum",
    symbol: "ETH",
    radius: 68,
    color: "#627EEA",
    glowColor: "#627EEA88",
    scoreValue: 32,
    iconUrl: "/eth-logo.png",
  },
  {
    level: 7,
    name: "Bitcoin",
    symbol: "BTC",
    radius: 82,
    color: "#F7931A",
    glowColor: "#F7931A88",
    scoreValue: 64,
    iconUrl: "/btc-logo.png",
  },
  {
    level: 8,
    name: "FarBase",
    symbol: "FB",
    radius: 100,
    color: "#0052FF",
    glowColor: "#0052FF88",
    scoreValue: 128,
    iconUrl: "/farbase-logo.png",
  },
];

export function getCoinByLevel(level: number): CoinType | undefined {
  return COINS.find((c) => c.level === level);
}
