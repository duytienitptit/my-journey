import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Bốn quy tắc dưới đây ép buộc bốn nguyên tắc kỹ thuật ở SPEC.md §8 — không phải quy ước,
// là lỗi build. Đọc CLAUDE.md trước khi đổi bất cứ dòng nào ở đây.
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
  ]),

  // §8.3 — một chỗ duy nhất được đọc đồng hồ. Mọi nơi khác gọi now() của core/clock.ts.
  // Test được miễn: cần Date.now() thật để so sánh now() không bị ghim có trả đúng giờ thật không.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["core/clock.ts", "test/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "Chỉ core/clock.ts được gọi `new Date()` (đọc đồng hồ hệ thống). Dùng now() từ core/clock.ts — SPEC.md §8.3.",
        },
        {
          selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            "Chỉ core/clock.ts được gọi `Date.now()`. Dùng now() từ core/clock.ts — SPEC.md §8.3.",
        },
      ],
    },
  },

  // §8.4 — logic game là hàm thuần: core/ không đụng DB, không đụng React/Next.
  {
    files: ["core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next", "next/*", "@/db", "@/db/*"],
              message:
                "core/ phải là hàm thuần (SPEC.md §8.4) — không import DB, React, hay Next.",
            },
          ],
        },
      ],
    },
  },

  // §8.2 — một file cấu hình duy nhất. Mọi con số cân bằng nằm trong core/balance.ts,
  // không rải rác trong logic. "warn" (không "error") vì chỉ số nhỏ/hằng toán học hợp lệ
  // (0, 1, -1, 2) vẫn cần dùng trực tiếp — đây là lưới nhắc, không phải luật tuyệt đối.
  {
    files: ["core/engine/**/*.{ts,tsx}"],
    rules: {
      "no-magic-numbers": [
        "warn",
        { ignore: [0, 1, -1, 2], ignoreArrayIndexes: true, detectObjects: false },
      ],
    },
  },
]);

export default eslintConfig;
