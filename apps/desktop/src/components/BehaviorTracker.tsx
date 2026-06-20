import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackBehavior } from "../services/beta";

export function BehaviorTracker() {
  const location = useLocation();

  useEffect(() => {
    const module = location.pathname.replace(/^\//, "") || "home";
    void trackBehavior("PAGE_VIEW", module);
  }, [location.pathname]);

  return null;
}
