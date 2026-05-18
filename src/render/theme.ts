export type ThemeName = "terminal" | "paper";

export type Theme = {
  name: ThemeName;
  background: string;
  foreground: string;
};

const THEMES: Record<ThemeName, Theme> = {
  terminal: {
    name: "terminal",
    background: "#0c0c0c",
    foreground: "#f2f2f2"
  },
  paper: {
    name: "paper",
    background: "#ffffff",
    foreground: "#111111"
  }
};

export function getTheme(name: ThemeName): Theme {
  return THEMES[name];
}

