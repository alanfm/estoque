import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "modules/acme/inventory");
const manifest = JSON.parse(
  readFileSync(resolve(source, "module.json"), "utf8"),
);
const composer = JSON.parse(
  readFileSync(resolve(source, "composer.json"), "utf8"),
);
const target = resolve(
  process.argv[2] ??
    resolve(
      root,
      `storage/app/inventory-distribution/inventory-${manifest.version}`,
    ),
);

function inspect(path) {
  if (lstatSync(path).isSymbolicLink())
    throw new Error(`Link simbólico não permitido: ${path}`);
  if (lstatSync(path).isDirectory()) {
    for (const name of readdirSync(path)) inspect(resolve(path, name));
  }
}

if (manifest.version !== composer.version)
  throw new Error("Versões Composer e manifesto divergentes.");
if (!existsSync(resolve(source, manifest.frontendEntry)))
  throw new Error("Entrada frontend ausente.");
if (existsSync(target))
  throw new Error(`O destino já existe: ${target}. Escolha uma pasta nova.`);
if (existsSync(`${target}.tar.gz`))
  throw new Error(`O arquivo ${target}.tar.gz já existe.`);
inspect(source);
mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
execFileSync("tar", ["-czf", `${target}.tar.gz`, "-C", target, "."]);
console.log(
  `Pacote ${composer.name} ${manifest.version} exportado em ${target}`,
);
console.log(
  "Publique o conteúdo desta pasta na raiz de um repositório GitHub dedicado.",
);
console.log(`Arquivo para distribuição: ${target}.tar.gz`);
