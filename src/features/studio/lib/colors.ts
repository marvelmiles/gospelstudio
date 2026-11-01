const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isHexColor = (value: string): boolean => HEX_COLOR.test(value);

const expandHex = (hex: string): string =>
  hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

export const withOpacity = (color: string, opacity: number): string => {
  if (!isHexColor(color)) return color;
  const hex = expandHex(color);
  const alpha = Math.min(Math.max(opacity, 0), 100) / 100;
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
