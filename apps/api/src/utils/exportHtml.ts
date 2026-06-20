import { MODULE_TITLES, MODULE_TYPE_MAP } from "../config/detail-price";

export interface DetailModule {
  type: string;
  title: string;
  blockType?: string;
  imageUrl?: string | null;
  status?: string;
}

export interface DetailExportData {
  title: string;
  sellingPoint: string;
  modules: DetailModule[];
  cover?: string | null;
  resultUrl?: string | null;
  width?: number;
}

export function buildModulesFromBlocks(
  blocks: Array<{ blockType: string; imageUrl?: string | null; status?: string }>,
  productName: string,
  sellingPoints: string[]
): DetailModule[] {
  return blocks.map((block) => {
    const type = MODULE_TYPE_MAP[block.blockType] ?? block.blockType.toLowerCase();
    return {
      type,
      title: MODULE_TITLES[type] ?? `${productName} · ${block.blockType}`,
      blockType: block.blockType,
      imageUrl: block.imageUrl,
      status: block.status,
    };
  });
}

export function exportHtml(data: DetailExportData): string {
  const modulesHtml = data.modules
    .map(
      (m) => `
    <section class="module module-${m.type}" data-type="${m.type}">
      <h2>${escapeHtml(m.title)}</h2>
      ${m.imageUrl ? `<img src="${escapeHtml(m.imageUrl)}" alt="${escapeHtml(m.title)}" />` : ""}
    </section>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${data.width ?? 790}, initial-scale=1" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { margin: 0; font-family: "PingFang SC", sans-serif; background: #fff; width: ${data.width ?? 790}px; }
    .hero { padding: 24px; background: linear-gradient(135deg, #eef2ff, #f8fafc); }
    h1 { margin: 0 0 12px; font-size: 28px; }
    .selling { color: #475569; line-height: 1.8; }
    .module { padding: 24px; border-top: 1px solid #e2e8f0; }
    .module img { width: 100%; display: block; border-radius: 8px; }
    h2 { font-size: 20px; margin: 0 0 12px; }
  </style>
</head>
<body>
  <header class="hero">
    <h1>${escapeHtml(data.title)}</h1>
    <p class="selling">${escapeHtml(data.sellingPoint)}</p>
  </header>
  ${modulesHtml}
</body>
</html>`;
}

export function exportPsdStructure(data: DetailExportData): object {
  return {
    version: "psd-structure-v1",
    document: {
      name: data.title,
      width: data.width ?? 790,
      height: "auto",
      colorMode: "RGB",
    },
    layers: data.modules.map((m, index) => ({
      id: `layer-${index + 1}`,
      name: m.title,
      type: m.type,
      visible: true,
      children: m.imageUrl
        ? [{ id: `layer-${index + 1}-img`, name: "Image", type: "pixel", source: m.imageUrl }]
        : [],
    })),
    note: "PSD 导出预留结构，后续版本接入真实 PSD 生成",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
