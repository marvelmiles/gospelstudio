import { describe, expect, it } from "vitest";
import { TEXT_SHADOW_PRESET } from "../lib/inlineStyle";
import { textShadowOptions } from "./textShadows";

const valuesOf = (current: string) =>
  textShadowOptions(current).map((option) =>
    typeof option === "string" ? option : option.value,
  );

describe("text shadow choices", () => {
  it("offers none, soft, sharp and outline", () => {
    const options = textShadowOptions("none");
    expect(options).toHaveLength(4);
    expect(valuesOf("none")).toContain(TEXT_SHADOW_PRESET);
  });

  it("keeps a shadow it does not know so the choice still shows", () => {
    const custom = "0 0 8px #ff0000";
    expect(valuesOf(custom)).toContain(custom);
    expect(textShadowOptions(custom)).toHaveLength(5);
  });
});
