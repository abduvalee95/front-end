import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Emitted by the Workflow SDK and already gitignored. They ship their own
    // /* eslint-disable */, which then reports as an unused directive — linting
    // generated code either way is noise.
    "src/app/.well-known/workflow/**",
  ]),
  {
    rules: {
      // A leading underscore is the deliberate "required by the signature,
      // unused on purpose" marker — for a tool `execute({ input })` callback or
      // a positional argument. Without this the convention reads as an error
      // and people delete parameters they cannot delete.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
