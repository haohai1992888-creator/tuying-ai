import { useEffect, useState } from "react";
import { fetchAnnouncements, type Announcement } from "../services/beta";

export default function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    void fetchAnnouncements().then(setItems);
  }, []);

  if (items.length === 0) return null;

  const item = items[0];

  return (
    <div
      style={{
        background: "#eff6ff",
        borderBottom: "1px solid #bfdbfe",
        padding: "10px 16px",
        color: "#1e40af",
      }}
    >
      <strong>{item.title}</strong>
      <span style={{ marginLeft: 12 }}>{item.content}</span>
    </div>
  );
}
