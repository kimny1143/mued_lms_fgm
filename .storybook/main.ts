import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "core": {
    "builder": "@storybook/builder-vite"
  },
  "viteFinal": async (config) => {
    return {
      ...config,
      optimizeDeps: {
        ...(config.optimizeDeps || {}),
        include: [
          ...(config.optimizeDeps?.include || []),
          '@storybook/react',
          '@storybook/test'
        ]
      }
    };
  }
};
export default config;