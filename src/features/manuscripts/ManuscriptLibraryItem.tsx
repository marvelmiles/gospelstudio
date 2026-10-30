import { memo, type ReactNode } from "react";
import { PenLine, Share2, Trash2 } from "lucide-react";
import type { Manuscript, Theme } from "../../types";
import type { BgMap } from "../../hooks/useBgMap";
import type { PresentOptions } from "../../hooks/usePresentActions";
import { useBackgroundView } from "../../hooks/useBackgroundView";
import { resolveLineStyle, resolveStyle } from "../../lib/resolve";
import { formatCountLabel } from "../../lib/formatNumber";
import { formatDate } from "../../lib/id";
import { SlideCanvas } from "../../components/SlideCanvas";
import { BgSwatch } from "../../components/controls/BgSwatch";
import { IconButton } from "@/components/shared/IconButton";
import { LazyMount } from "@/components/shared/LazyMount";
import { MoreMenu } from "@/components/shared/MoreMenu";
import type { MenuItem } from "@/components/shared/menuItem";
import { useKeepOnResetAction } from "@/components/shared/useKeepOnReset";
import { KeepOnResetBadge } from "@/components/shared/KeepOnResetToggle";
import { PinButton } from "@/components/shared/PinControl";
import { PresentMenu } from "@/components/shared/PresentMenu";
import { LibraryListRow } from "@/components/shared/LibraryListRow";
import { cardOpenProps } from "@/components/shared/cardOpenProps";
import {
  CardActions,
  CardTitle,
  cardBodyClassName,
  cardClassName,
  cardSubClassName,
  cardThumbBadgeClassName,
} from "@/components/shared/InteractiveCard";

export interface ManuscriptItemActions {
  open: (manuscript: Manuscript) => void;
  present: (manuscript: Manuscript, live: boolean) => void;
  share: (manuscript: Manuscript) => void;
  remove: (manuscript: Manuscript) => void;
}

interface ManuscriptItemProps {
  manuscript: Manuscript;
  themes: Theme[];
  bgMap: BgMap;
  usedPins: number;
  actions: ManuscriptItemActions;
}

interface ManuscriptItemControls {
  cover: ReactNode;
  menuItems: MenuItem[];
  onOpen: () => void;
  onPresent: (options: PresentOptions) => void;
  onDelete: () => void;
}

const coverPlaceholder = <div className="aspect-video bg-thumbnail" />;

const ManuscriptCoverContent = ({
  manuscript,
  themes,
  bgMap,
}: Pick<ManuscriptItemProps, "manuscript" | "themes" | "bgMap">) => {
  const first = manuscript.slides?.[0];
  const theme =
    themes.find((t) => t.id === manuscript.defaultThemeId) || themes[0];
  const { background, image, video } = useBackgroundView(
    first,
    manuscript,
    theme,
    bgMap,
  );

  if (!first)
    return (
      <BgSwatch bg={background} settings={image} className="aspect-video" />
    );

  return (
    <SlideCanvas
      slide={first}
      bg={background}
      bgImage={image}
      bgVideo={video}
      radius={0}
      style={resolveStyle(first, manuscript, theme)}
      lineStyles={first.lines.map((_, i) =>
        resolveLineStyle(first, i, manuscript, theme),
      )}
    />
  );
};

const manuscriptMenuItems = (
  onOpen: () => void,
  onQuickShare: () => void,
  keepAction: MenuItem | null,
): MenuItem[] => [
  { label: "Open in editor", icon: PenLine, onClick: onOpen },
  {
    label: "Quick share",
    icon: Share2,
    title: "Send this to another device on your WiFi",
    onClick: onQuickShare,
  },
  ...(keepAction ? [keepAction] : []),
];

const manuscriptDetails = (manuscript: Manuscript): string[] => [
  manuscript.author || "Unknown author",
  ...(manuscript.collection ? [manuscript.collection] : []),
  formatCountLabel(manuscript.slides?.length || 0, "slide"),
  `Added ${formatDate(manuscript.createdAt)}`,
  `Last modified ${formatDate(manuscript.updatedAt)}`,
];

const deleteTitle = (manuscript: Manuscript): string =>
  manuscript.builtIn
    ? "Default manuscripts can't be deleted"
    : "Delete manuscript";

const useManuscriptItem = ({
  manuscript,
  themes,
  bgMap,
  actions,
}: ManuscriptItemProps): ManuscriptItemControls => {
  const keepAction = useKeepOnResetAction("manuscript", manuscript);
  const onOpen = () => actions.open(manuscript);

  return {
    cover: (
      <LazyMount placeholder={coverPlaceholder}>
        <ManuscriptCoverContent
          manuscript={manuscript}
          themes={themes}
          bgMap={bgMap}
        />
      </LazyMount>
    ),
    menuItems: manuscriptMenuItems(
      onOpen,
      () => actions.share(manuscript),
      keepAction,
    ),
    onOpen,
    onPresent: ({ live }) => actions.present(manuscript, live),
    onDelete: () => actions.remove(manuscript),
  };
};

interface ManuscriptItemButtonsProps {
  manuscript: Manuscript;
  usedPins: number;
  controls: ManuscriptItemControls;
  fill?: boolean;
}

const ManuscriptItemButtons = ({
  manuscript,
  usedPins,
  controls,
  fill,
}: ManuscriptItemButtonsProps) => (
  <>
    <PresentMenu fill={fill} onPresent={controls.onPresent} />
    <PinButton kind="manuscript" item={manuscript} usedPins={usedPins} />
    <IconButton
      filled
      danger
      size="sm"
      icon={Trash2}
      disabled={manuscript.builtIn}
      title={deleteTitle(manuscript)}
      onClick={controls.onDelete}
    />
    <MoreMenu filled size="sm" items={controls.menuItems} />
  </>
);

const ManuscriptRowView = (props: ManuscriptItemProps) => {
  const { manuscript, usedPins } = props;
  const controls = useManuscriptItem(props);

  return (
    <LibraryListRow
      cover={controls.cover}
      title={manuscript.title}
      badges={<KeepOnResetBadge item={manuscript} />}
      details={manuscriptDetails(manuscript)}
      onOpen={controls.onOpen}
      actions={
        <ManuscriptItemButtons
          manuscript={manuscript}
          usedPins={usedPins}
          controls={controls}
        />
      }
    />
  );
};

const ManuscriptCardView = (props: ManuscriptItemProps) => {
  const { manuscript, usedPins } = props;
  const controls = useManuscriptItem(props);

  return (
    <div
      className={cardClassName}
      {...cardOpenProps(manuscript.title, controls.onOpen)}
    >
      <div className="relative">
        {controls.cover}
        <div className={cardThumbBadgeClassName}>
          {formatCountLabel(manuscript.slides?.length || 0, "slide")}
        </div>
      </div>
      <div className={cardBodyClassName}>
        <CardTitle title={manuscript.title}>
          <KeepOnResetBadge item={manuscript} />
        </CardTitle>
        <div className={cardSubClassName}>
          {manuscript.author || "Unknown"}
          {manuscript.collection ? ` · ${manuscript.collection}` : ""}
        </div>
        <CardActions>
          <ManuscriptItemButtons
            manuscript={manuscript}
            usedPins={usedPins}
            controls={controls}
            fill
          />
        </CardActions>
      </div>
    </div>
  );
};

export const ManuscriptRow = memo(ManuscriptRowView);
export const ManuscriptCard = memo(ManuscriptCardView);
