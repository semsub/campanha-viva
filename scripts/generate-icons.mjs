// Gera todos os ícones do PWA/APK a partir de public/icons/icon-source.png
// Uso: node scripts/generate-icons.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/icons/icon-source.png";
const OUT = "public/icons";

// Tamanhos padrão para PWA + Android + iOS
const SIZES = [
  { size: 48,   name: "icon-48.png"   },
  { size: 72,   name: "icon-72.png"   },
  { size: 96,   name: "icon-96.png"   },
  { size: 128,  name: "icon-128.png"  },
  { size: 144,  name: "icon-144.png"  },
  { size: 152,  name: "icon-152.png"  },
  { size: 167,  name: "icon-167.png"  },
  { size: 180,  name: "apple-touch-icon.png" }, // iOS
  { size: 192,  name: "icon-192.png"  },
  { size: 256,  name: "icon-256.png"  },
  { size: 384,  name: "icon-384.png"  },
  { size: 512,  name: "icon-512.png"  },
  { size: 1024, name: "icon-1024.png" },
];

await fs.mkdir(OUT, { recursive: true });

for (const s of SIZES) {
  await sharp(SRC)
    .resize(s.size, s.size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(OUT, s.name));
  console.log(`✓ ${s.name} (${s.size}x${s.size})`);
}

// Ícone MASCARÁVEL (fundo cheio + zoom para caber no "safe zone" ~80%)
// Necessário para o Android exibir com bordas arredondadas sem cortar
await sharp(SRC)
  .resize(410, 410, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 51, bottom: 51, left: 51, right: 51,
            background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(path.join(OUT, "icon-maskable-512.png"));
console.log("✓ icon-maskable-512.png (512x512, safe-zone)");

await sharp(SRC)
  .resize(154, 154, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 19, bottom: 19, left: 19, right: 19,
            background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(path.join(OUT, "icon-maskable-192.png"));
console.log("✓ icon-maskable-192.png (192x192, safe-zone)");

// Favicon
await sharp(SRC).resize(32, 32).png().toFile("public/favicon.png");
await sharp(SRC).resize(16, 16).png().toFile("public/favicon-16.png");
console.log("✓ favicon.png / favicon-16.png");

console.log("\nÍcones gerados com sucesso em public/icons/");
