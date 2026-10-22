import "@resume/tokens/font.css";
import "../src/styles.css";
import { TooltipProvider } from "@resume/ui/components/tooltip";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    a11y: { test: "error" },
    backgrounds: {
      options: {
        canvas: { name: "페이지 배경", value: "#f2f3f5" },
        card: { name: "카드", value: "#ffffff" },
      },
    },
    viewport: {
      options: {
        desktop1440: {
          name: "데스크톱 1440",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
        mobile390: {
          name: "모바일 390",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
