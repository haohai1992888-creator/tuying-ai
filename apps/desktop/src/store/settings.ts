const PREFERENCE_KEY = "acs_model_preference";

export type ModelPreference = "auto" | "gpt" | "seedream" | "gemini";

export const MODEL_OPTIONS: Array<{ value: ModelPreference; label: string }> = [
  { value: "auto", label: "自动选择（推荐）" },
  { value: "gpt", label: "GPT Image 2" },
  { value: "seedream", label: "Seedream" },
  { value: "gemini", label: "Gemini Flash Image" },
];

export function getPreferredProvider(): ModelPreference {
  const v = localStorage.getItem(PREFERENCE_KEY);
  if (v === "gpt" || v === "seedream" || v === "gemini" || v === "auto") return v;
  return "auto";
}

export function setPreferredProvider(value: ModelPreference): void {
  localStorage.setItem(PREFERENCE_KEY, value);
}
