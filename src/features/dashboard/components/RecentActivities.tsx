import { Clock } from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { timeAgo } from "../utils";
import type { Activity } from "../utils";

interface RecentActivitiesProps {
  activities: Activity[];
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => (
  <div className="glass p-5.5">
    <h3 className="mt-0 mb-3.5 flex items-center gap-2 text-lg text-fg">
      <Clock size={16} className="text-accent" /> Recent Activities
    </h3>
    {activities.length === 0 && (
      <EmptyState
        bare
        compact
        icon={Clock}
        title="No activity yet"
        message="Create a manuscript, read the Bible or upload media and it will show up here."
      />
    )}
    <div className="max-h-130 overflow-y-auto">
      {activities.map((activity) => (
        <div
          key={activity.key}
          onClick={activity.open}
          className="flex cursor-pointer items-center gap-3 border-b border-line py-2.75"
        >
          <div className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-accent/12 text-accent-soft">
            <activity.icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-semibold text-fg">
              {activity.title}
            </div>
            <div className="text-[12.5px] text-sub">{activity.detail}</div>
          </div>
          <span className="shrink-0 text-xs text-dim">
            {timeAgo(activity.at)}
          </span>
        </div>
      ))}
    </div>
  </div>
);
