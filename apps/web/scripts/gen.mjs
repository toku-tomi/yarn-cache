// scripts/gen.mjs
import fs from "node:fs";
import path from "node:path";

const PAGES = Number(process.env.PAGES ?? 1200);     // ルート数
const MODULES = Number(process.env.MODULES ?? 250);  // モジュール数
const IMPORTS = Number(process.env.IMPORTS ?? 30);   // 1ページあたりのimport数

const root = process.cwd();

function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

function pad4(n) {
  return String(n).padStart(4, "0");
}

function makeModules() {
  // 依存が鎖状になるようにして、解決と最適化を重くする
  for (let i = 0; i < MODULES; i++) {
    const name = `m${pad4(i)}`;
    const next = i + 1 < MODULES ? `./m${pad4(i + 1)}` : null;

    const imports = next ? `import { f as g } from "${next}";\n` : "";
    const body = `
${imports}
export const f = (x: number) => {
  // 無駄にコード量＆計算を増やす（ビルドの主目的：コンパイル/最適化負荷）
  let v = x;
  for (let i = 0; i < 4000; i++) v = (v * 1103515245 + 12345) >>> 0;
  return ${next ? "g(v ^ 0x9e3779b9)" : "String(v).slice(0, 8)"};
};
`.trimStart();

    write(path.join(root, "src", "gen", `${name}.ts`), body);
  }
}

function makeEntry() {
  // 多数のモジュールをまとめてexportするバレル（解決と解析を重くする）
  const exports = Array.from({ length: MODULES })
    .map((_, i) => {
      const name = `m${pad4(i)}`;
      return `export { f as ${name} } from "./${name}";`;
    })
    .join("\n");
  write(path.join(root, "src", "gen", "index.ts"), exports + "\n");
}

function makePages() {
  for (let i = 1; i <= PAGES; i++) {
    const dir = pad4(i);
    const picks = [];
    // 1ページで IMPORTS 個のモジュールを import して使う
    for (let k = 0; k < IMPORTS; k++) {
      const idx = (i * 37 + k * 13) % MODULES;
      picks.push(`m${pad4(idx)}`);
    }

    const importLine = `import { ${picks.join(", ")} } from "../../../src/gen";\n`;

    const useLines = picks
      .map((m, idx) => `const v${idx} = ${m}(${i} + ${idx});`)
      .join("\n");

    const page = `
${importLine}
export default function Page() {
${useLines}
  return (
    <main>
      <h1>route ${dir}</h1>
      <p>{String(v0).slice(0, 10)}</p>
    </main>
  );
}
`.trimStart();

    write(path.join(root, "app", "r", dir, "page.tsx"), page);
  }

  // 入口ページ
  write(
    path.join(root, "app", "page.tsx"),
    `export default function Home(){return <main>home</main>}\n`
  );
}

makeModules();
makeEntry();
makePages();

console.log(
  `generated: pages=${PAGES}, modules=${MODULES}, importsPerPage=${IMPORTS}`
);
