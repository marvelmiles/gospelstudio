import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { pageClassName } from "@/components/shared/PageHeader";
import { useDashboardData } from "./useDashboardData";
import { GreetingHeader } from "./components/GreetingHeader";
import { OverviewGrid } from "./components/OverviewGrid";
import { StorageCard } from "./components/StorageCard";
import { RecentActivities } from "./components/RecentActivities";
import { ManuscriptsByCategory } from "./components/ManuscriptsByCategory";
import { MostUsedArtifacts } from "./components/MostUsedArtifacts";

export const Dashboard = () => {
  useDocumentTitle("Dashboard");
  const {
    greeting,
    counts,
    manuscriptsByCollection,
    largestCollectionCount,
    mostUsed,
    activities,
    storage,
  } = useDashboardData();

  const showStorage =
    storage && (storage.level !== "ok" || storage.backend !== "indexeddb");

  return (
    <div className={pageClassName}>
      <GreetingHeader
        label={greeting.label}
        heading={greeting.heading}
        tag={greeting.tag}
      />

      <OverviewGrid counts={counts} />

      {showStorage && <StorageCard storage={storage} />}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <RecentActivities activities={activities} />

        <div className="grid gap-4">
          <ManuscriptsByCategory
            data={manuscriptsByCollection}
            largest={largestCollectionCount}
          />
          <MostUsedArtifacts mostUsed={mostUsed} />
        </div>
      </div>
    </div>
  );
};
