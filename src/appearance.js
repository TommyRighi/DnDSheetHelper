export const defaultAppearance = { mode: "dark", accent: "#d99a68" };

export function readAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem("fable-appearance"));
    return {
      mode: saved?.mode === "light" ? "light" : "dark",
      accent: /^#[\da-f]{6}$/i.test(saved?.accent) ? saved.accent : defaultAppearance.accent,
    };
  } catch {
    return { ...defaultAppearance };
  }
}

const luminance = (hex) => {
  const channels = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export function themeVariables({ mode, accent }) {
  // Preserve the selected swatch; adapt text accents for legibility on each theme.
  const light = mode === "light";
  let readable = accent;
  const background = light ? 0.9 : 0.025;
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  for (let i = 0; i < 30 && contrast(luminance(readable), background) < 4.5; i++) {
    readable = "#" + [1, 3, 5].map(index => {
      const c = parseInt(readable.slice(index, index + 2), 16);
      return Math.round(c + ((light ? 0 : 255) - c) * .12).toString(16).padStart(2, "0");
    }).join("");
  }
  return {
    "--accent-fill": accent,
    "--accent": readable,
    "--on-accent": luminance(accent) > .179 ? "#000000" : "#ffffff",
  };
}
