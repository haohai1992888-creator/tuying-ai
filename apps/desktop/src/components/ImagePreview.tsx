import { useEffect, useRef, useState } from "react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  authHeaders?: HeadersInit;
  onDelete?: () => void;
}

export default function ImagePreview({ src, alt = "preview", authHeaders, onDelete }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    let revoked: string | null = null;
    if (authHeaders) {
      fetch(src, { headers: authHeaders })
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          revoked = url;
          setBlobUrl(url);
        })
        .catch(() => setBlobUrl(src));
    } else {
      setBlobUrl(src);
    }
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src, authHeaders]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }

  function onMouseUp() {
    setDragging(false);
  }

  if (!blobUrl) return <div>加载预览...</div>;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        overflow: "hidden",
        background: "#0f172a",
        position: "relative",
        height: 320,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, zIndex: 2 }}>
        <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setScale((s) => Math.min(s + 0.2, 3))}>
          +
        </button>
        <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}>
          -
        </button>
        {onDelete && (
          <button className="btn" style={{ padding: "4px 8px", background: "#dc2626" }} onClick={onDelete}>
            删除
          </button>
        )}
      </div>
      <img
        src={blobUrl}
        alt={alt}
        draggable={false}
        onMouseDown={onMouseDown}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
          maxWidth: "100%",
          maxHeight: "100%",
          margin: "auto",
          display: "block",
          paddingTop: 40,
          userSelect: "none",
        }}
      />
    </div>
  );
}
