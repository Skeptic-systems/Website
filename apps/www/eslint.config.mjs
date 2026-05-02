import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...nextCoreWebVitals,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
);
