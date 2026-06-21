export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "首页", path: "/", icon: "🏠" },
  { label: "AI 商品图", path: "/scene-image", icon: "🖼️" },
  { label: "AI 详情页", path: "/detail-page", icon: "📄" },
  { label: "AI 模板市场", path: "/templates", icon: "🎨" },
  { label: "图片工具箱", path: "/upload", icon: "🧰" },
  { label: "我的任务", path: "/tasks", icon: "📋" },
  { label: "我的作品", path: "/files", icon: "💼" },
  { label: "积分中心", path: "/points", icon: "💎" },
  { label: "会员中心", path: "/membership", icon: "👑" },
];

export const QUICK_ENTRIES = [
  {
    title: "AI 商品图",
    desc: "一键生成精美商品图",
    path: "/scene-image",
    icon: "🖼️",
    color: "#eef2ff",
  },
  {
    title: "AI 详情页",
    desc: "生成专业详情页",
    path: "/detail-page",
    icon: "📄",
    color: "#fdf2f8",
  },
  {
    title: "模板市场",
    desc: "270+ 精美模板任选",
    path: "/templates",
    icon: "🎨",
    color: "#fff7ed",
  },
  {
    title: "图片工具箱",
    desc: "智能抠图、换背景等",
    path: "/upload",
    icon: "🧰",
    color: "#ecfeff",
  },
];

export const FEATURED_TEMPLATES = [
  { name: "护肤美妆", count: "使用 12.5k", tone: "linear-gradient(135deg,#fbcfe8,#ddd6fe)" },
  { name: "家居生活", count: "使用 9.8k", tone: "linear-gradient(135deg,#fde68a,#fdba74)" },
  { name: "数码 3C", count: "使用 8.2k", tone: "linear-gradient(135deg,#bfdbfe,#c4b5fd)" },
  { name: "运动户外", count: "使用 6.4k", tone: "linear-gradient(135deg,#bbf7d0,#86efac)" },
  { name: "箱包配饰", count: "使用 5.1k", tone: "linear-gradient(135deg,#fecdd3,#fda4af)" },
  { name: "食品生鲜", count: "使用 4.7k", tone: "linear-gradient(135deg,#fed7aa,#fdba74)" },
];
