import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useWindowSize } from "usehooks-ts";
import { cn } from "../../lib/cn";
import { IconButton } from "../ui/Button";
import { NavDrawer } from "./NavDrawer";
import { useAppNavigation } from "./appNavigation";
import { APP_NAME } from "../../lib/appInfo";
import routes, { isRouteActive } from "../../routes";

/* The header never squeezes items: it shows as many icons as fit, and puts the rest in a menu. */
const ICON_SLOT = 38;
const LOGO_SLOT = 34;
const MENU_SLOT = 38;
const WORDMARK_SLOT = 132;
const LABELLED_FROM = 1120;
const WORDMARK_FROM = 780;
const WIDE_PADDING_FROM = 700;

export const AppHeader = () => {
  const location = useLocation();
  const { width } = useWindowSize();
  const { destinations, actions } = useAppNavigation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const labelled = width >= LABELLED_FROM;
  const showWordmark = width >= WORDMARK_FROM;
  const wide = width >= WIDE_PADDING_FROM;
  const edgePadding = wide ? 22 : 12;
  const chrome =
    edgePadding * 2 + LOGO_SLOT + (showWordmark ? WORDMARK_SLOT : 0) + 16;
  const totalItems = destinations.length + actions.length;
  const capacity = Math.floor((width - chrome) / ICON_SLOT);
  const needsDrawer = !labelled && capacity < totalItems;
  const visibleCount = needsDrawer
    ? Math.max(1, Math.floor((width - chrome - MENU_SLOT) / ICON_SLOT))
    : totalItems;

  const visibleDestinations = destinations.slice(0, visibleCount);
  const visibleActions = actions.slice(
    0,
    Math.max(0, visibleCount - destinations.length),
  );

  return (
    <header
      className={cn(
        "flex h-14.5 shrink-0 items-center gap-2 border-b border-line bg-canvas-2/80 backdrop-blur-md",
        wide ? "px-5.5" : "px-3",
      )}
    >
      <Link
        to={routes.dashboard()}
        aria-label={`${APP_NAME} home`}
        className="flex shrink-0 items-center gap-2.75 no-underline"
      >
        <img
          src="/favicon.svg"
          alt=""
          width={34}
          height={34}
          className="rounded-[9px] shadow-cta"
        />
        {showWordmark && (
          <span className="text-lg leading-[1.1] font-semibold tracking-[-0.2px] whitespace-nowrap text-fg">
            {APP_NAME}
          </span>
        )}
      </Link>

      <nav
        aria-label="Primary"
        className={cn("flex shrink-0 gap-1", labelled && "ml-3")}
      >
        {visibleDestinations.map((item) => {
          const path = item.path ?? routes.dashboard();
          const active = isRouteActive(path, location.pathname);
          return (
            <Link
              key={item.id}
              to={path}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8.5 items-center justify-center gap-2 border text-[13.5px] font-semibold whitespace-nowrap no-underline",
                labelled ? "rounded-[10px] px-3.5" : "w-8.5 rounded-[9px] p-0",
                active
                  ? "border-line bg-raise text-fg"
                  : "border-transparent bg-transparent text-sub",
              )}
            >
              <item.icon size={16} />
              {labelled && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {visibleActions.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            title={item.label}
            active={
              item.path
                ? isRouteActive(item.path, location.pathname)
                : undefined
            }
            onClick={item.run}
          />
        ))}
        {needsDrawer && (
          <IconButton
            icon={Menu}
            title="Open menu"
            onClick={() => setDrawerOpen(true)}
          />
        )}
      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={location.pathname}
        destinations={destinations}
        actions={actions}
      />
    </header>
  );
};
