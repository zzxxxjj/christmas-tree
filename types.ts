export interface HandStatus {
  isExploded: boolean;
  confidence: number;
}

export interface TreeConfig {
  particleCount: number;
  height: number;
  radius: number;
  colors: string[];
}