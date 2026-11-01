import { useEditorStore } from "../store/editorStore";
import { useStageScale } from "../render/renderSurface";

const GUIDE_SCREEN_PX = 1.5;

export const AlignmentGuides = () => {
  const guides = useEditorStore((state) => state.guides);
  const scale = useStageScale() || 1;
  const thickness = GUIDE_SCREEN_PX / scale;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[9999]">
      {guides.map((guide) => (
        <div
          key={`${guide.orientation}:${guide.position}`}
          style={
            guide.orientation === "vertical"
              ? { left: guide.position - thickness / 2, width: thickness }
              : { top: guide.position - thickness / 2, height: thickness }
          }
          className={
            guide.orientation === "vertical"
              ? "absolute inset-y-0 bg-primary-soft"
              : "absolute inset-x-0 bg-primary-soft"
          }
        />
      ))}
    </div>
  );
};
