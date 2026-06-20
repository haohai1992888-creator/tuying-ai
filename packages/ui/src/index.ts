/**
 * @acs/ui — 公共 UI 组件包
 * Phase 1: 仅占位，Shadcn 组件在 Sprint 2+ 迁入
 */
export const UI_PACKAGE_VERSION = "1.0.0";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
