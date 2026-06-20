/** 渲染 Prompt 模板变量 {{product}} {{style}} 等 */
export function renderPromptTemplate(
  content: string,
  variables: Record<string, string | undefined>
): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key]?.trim();
    return value ?? "";
  });
}

export function extractVariableKeys(content: string): string[] {
  const keys = new Set<string>();
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return [...keys];
}
