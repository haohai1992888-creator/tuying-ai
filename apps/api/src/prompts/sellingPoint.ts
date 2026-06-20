export function buildSellingPointPrompt(productName: string): string {
  return `
你是一位资深电商运营。

产品：

${productName}

输出：

1、核心卖点

2、用户痛点

3、使用场景

4、购买理由

5、营销文案

请用简洁中文条目输出，每条一行，用「·」开头。
`.trim();
}
