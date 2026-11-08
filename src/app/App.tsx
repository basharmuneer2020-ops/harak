import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { ar } from "../i18n/ar";
import { useApp } from "../store/useApp";
import { Notice } from "../ui/controls";
import { navigate, useRoute } from "./router";
import { Shell, type TabId } from "./Shell";

const TodayPage = lazy(() => import("../features/workout/TodayPage"));
const ProgramPage = lazy(() => import("../features/builder/ProgramPage"));
const LibraryPage = lazy(() => import("../features/library/LibraryPage"));
const PatternPage = lazy(() => import("../features/library/PatternPage"));
const MusclePage = lazy(() => import("../features/library/MusclePage"));
const ExercisePage = lazy(() => import("../features/library/ExercisePage"));
const CustomExercisePage = lazy(
  () => import("../features/library/CustomExercisePage"),
);
const HistoryPage = lazy(() => import("../features/history/HistoryPage"));
const DayPage = lazy(() => import("../features/history/DayPage"));
const ExerciseHistoryPage = lazy(
  () => import("../features/history/ExerciseHistoryPage"),
);
const MePage = lazy(() => import("../features/profile/MePage"));
const WorkoutPage = lazy(() => import("../features/workout/WorkoutPage"));
const SummaryPage = lazy(() => import("../features/workout/SummaryPage"));
const OnboardingPage = lazy(() => import("../features/profile/OnboardingPage"));

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

function libraryRoute(seg: string[]): ReactNode {
  const [, kind, id = ""] = seg;
  switch (kind) {
    case "pattern":
      return <PatternPage id={id} />;
    case "muscle":
      return <MusclePage id={id} />;
    case "exercise":
      return <ExercisePage id={id} />;
    case "new":
      return <CustomExercisePage />;
    default:
      return <LibraryPage />;
  }
}

export function App() {
  const route = useRoute();
  const ready = useApp((s) => s.ready);
  const error = useApp((s) => s.error);
  const hasProfile = useApp((s) => s.profile !== null);
  const head = route.segments[0] ?? "";

  useEffect(() => {
    void useApp.getState().init();
  }, []);

  useEffect(() => {
    if (!head) navigate("/today", { replace: true });
  }, [head]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.path]);

  const active = (TAB_IDS as string[]).includes(head) ? (head as TabId) : null;

  let page: ReactNode;
  let hideTabs = false;
  if (!ready) {
    page = <Loading />;
  } else if (error) {
    page = <Notice tone="danger">{ar.app.storageError}</Notice>;
  } else if (!hasProfile) {
    page = <OnboardingPage />;
    hideTabs = true;
  } else {
    switch (head) {
      case "program":
        page = <ProgramPage />;
        break;
      case "library":
        page = libraryRoute(route.segments);
        break;
      case "history":
        if (route.segments[1] === "day") {
          page = <DayPage day={route.segments[2] ?? ""} />;
        } else if (route.segments[1] === "exercise") {
          page = <ExerciseHistoryPage id={route.segments[2] ?? ""} />;
        } else {
          page = <HistoryPage />;
        }
        break;
      case "me":
        page = <MePage />;
        break;
      case "workout":
        if (route.segments[1] === "summary") {
          page = <SummaryPage id={route.segments[2] ?? ""} />;
        } else {
          page = <WorkoutPage />;
          hideTabs = true;
        }
        break;
      default:
        page = <TodayPage />;
    }
  }

  return (
    <Shell active={active ?? "today"} hideTabs={hideTabs}>
      <Suspense fallback={<Loading />}>{page}</Suspense>
    </Shell>
  );
}
