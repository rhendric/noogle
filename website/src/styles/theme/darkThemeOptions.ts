import { ThemeOptions } from "@mui/material/styles";
import { commonOptions } from "./common";

const darkThemeOptions: ThemeOptions = {
  ...commonOptions,
  palette: {
    mode: "dark",
    background: {
      paper: "#0f192c",
    },
    primary: {
      main: "#6586c8",
    },
    secondary: {
      main: "#6ad541",
    },
  },
};

export { darkThemeOptions };
