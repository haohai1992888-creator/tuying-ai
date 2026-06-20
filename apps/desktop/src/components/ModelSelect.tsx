export type ModelOption = "auto" | "gpt" | "seedream" | "gemini";

interface ModelSelectProps {
  value: ModelOption;
  onChange: (value: ModelOption) => void;
}

export default function ModelSelect({ value, onChange }: ModelSelectProps) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value as ModelOption)}
    >
      <option value="auto">自动路由</option>
      <option value="gpt">GPT Image</option>
      <option value="seedream">Seedream</option>
      <option value="gemini">Gemini</option>
    </select>
  );
}
