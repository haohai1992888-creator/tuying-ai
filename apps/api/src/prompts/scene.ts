export function buildScenePrompt(productName: string): string {
  return `
电商商品摄影。

产品：${productName}

要求：

高端商业摄影。

柔和光线。

真实场景。

8K。

电商广告风格。
`.trim();
}
