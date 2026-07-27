import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Every route change lands at the top — deep links shouldn't open mid-page. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
