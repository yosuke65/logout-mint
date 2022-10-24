import { extendTheme } from "@chakra-ui/react";
import '@fontsource/inter/500.css'

const fonts = {
  heading: `'Inter'`,
  body: `'Inter'`,
};

const styles = {
  global: (props) => ({
    body: {
      bg: "#2d1674",
    }
  }),
};

const components = {
  Text: {
    baseStyle: (props) => ({
      color: "#FFFFFF",
      fontFamily: `'Inter'`,
    }),
  },
};

const theme = extendTheme({ fonts, styles, components });
export default theme;
