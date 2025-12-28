import { f as g } from "./m0160";

export const f = (x: number) => {
  // 無駄にコード量＆計算を増やす（ビルドの主目的：コンパイル/最適化負荷）
  let v = x;
  for (let i = 0; i < 4000; i++) v = (v * 1103515245 + 12345) >>> 0;
  return g(v ^ 0x9e3779b9);
};
