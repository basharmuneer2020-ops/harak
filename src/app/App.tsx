import { lazy, Suspense, useEffect } from "react";
import { ar } from "../i18n/ar";
import { navigate, useRoute } from "./router";
import { Shell, type TabId } from "./Shell";

const TodayPage = lazy(() => import("../features/workout/TodayPage"));
const ProgramPage = lazy(() => import("../features/builder/ProgramPage"));
const LibraryPage = lazy(() => import("../features/library/LibraryPage"));
const HistoryPage = lazy(() => import("../features/history/HistoryPage"));
const MePage = lazy(() => import("../features/profile/MePage"));

const TAB_IDS: TabId[] = ["today", "program", "library", "history", "me"];

function Loading() {
  return (
    <p
      role="status"
      style={{
        color: "var(--text-dim)",
        padding: "40px 0",
        textAlign: "center",
      }}
    >
      {ar.app.loading}
    </p>
  );
}

export function App() {
  const route = useRoute();
  const head = route.segments[0] ?? "";

  useEffect(() => {
    if (!head) navigate("/today", { replace: true });
  }, [head]);

  const active = (TAB_IDS as string[]).includes(head) ? (head as TabId) : null;

  let page;
  switch (head) {
    case "program":
      page = <ProgramPage />;
      break;
    case "library":
      page = <LibraryPage />;
      break;
    case "history":
      page = <HistoryPage />;
      break;
    case "me":
      page = <MePage />;
      break;
    default:
      page = <TodayPage />;
  }

  return (
    <Shell active={active ?? "today"}>
      <Suspense fallback={<Loading />}>{page}</Suspense>
    </Shell>
  );
}
