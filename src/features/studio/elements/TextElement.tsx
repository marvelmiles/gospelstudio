import { FormattedText } from "../../../components/FormattedText";
import type { TextLayer } from "../types/layer";
import { LayerBackdrop } from "./LayerBackdrop";
import { TextPanel } from "./TextPanel";

export const TextElement = ({ layer }: { layer: TextLayer }) => (
  <div className="relative size-full">
    <LayerBackdrop fill={layer.fill} />
    <TextPanel
      text={layer.text}
      fit
      fitKey={`${layer.content}:${layer.dimensions.width}x${layer.dimensions.height}`}
    >
      <div className="whitespace-pre-wrap">
        <FormattedText
          text={layer.content}
          baseWeight={layer.text.fontWeight}
        />
      </div>
    </TextPanel>
  </div>
);
