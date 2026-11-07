import { Info } from "lucide-react";
import { Panel, PanelTitle } from "@/components/shared/Panel";

const NOTES = [
  "Unique visitors are estimates from Plausible, not a count of real people. Plausible recognises a browser for one day only, so someone who visits on several days counts once for each day in a longer period, and someone on two devices counts twice.",
  "Weekly and monthly figures are asked from Plausible for the whole period. Daily figures are never added up to make them.",
  "Unique visitors and occurrences are different numbers. One visitor creating five manuscripts is 1 unique visitor and 5 manuscripts created.",
  "Returning visitors come from a day stamp kept in the browser. Clearing site data, a private window or a new device makes a returning person look new.",
  "Plausible filters known bots, crawlers, spam and data centre traffic. Ad and tracker blockers stop some real visits from being counted.",
  "Actions taken offline are not sent later, so offline use is undercounted. Localhost, development builds and deploy previews are never counted.",
];

export const MeasurementNotes = () => (
  <Panel>
    <PanelTitle title="How to read these numbers" icon={Info} />
    <ul className="m-0 grid gap-2 pl-5 text-[13px] leading-relaxed text-muted-foreground">
      {NOTES.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  </Panel>
);
