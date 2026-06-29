# i18n Dictionary Rules

This document defines the list of technical terms, brand names, and proper nouns that must be strictly controlled during the translation process. This ensures that both humans and AI agents do not mistakenly translate these terms, which would cause UI inconsistencies.

## 🚫 UNTRANSLATABLE TERMS (Hardcode Only)

The following terms **MUST NOT** be added to translation JSON files (e.g., `en.json`, `vi.json`) and **MUST NOT** be wrapped in the `t()` function. They must remain hardcoded directly in the source code. Anything not on this list should be translated.

- **Brand Names:**
  - `INBLUE AI`
- **Programming Languages:**
  - `Java`
  - `Javascript`
  - `TypeScript`
  - `Python`
  - `C#`
  - `SQL`
  - `Go`
  - `XML`
  - `React`
  - `Angular`
  - `Vue`
  - `Node.js`
  - `Spring Boot`
  - `HTML`
  - `CSS`
  - `JSON`
  - `C++`
  - `PHP`
  - `Swift`
  - `Kotlin`
  - `Rust`
- **Measurement Units & Acronyms:**
  - `ms`
  - `MB`
  - `lines`
  - `KB`
  - `GB`
  - `TB`
  - `px`
  - `fps`
- **Job Levels & IT Roles:**
  - `Intern`
  - `Fresher`
  - `Junior`
  - `Middle`
  - `Senior`
  - `Frontend`
  - `Backend`
  - `Fullstack`
  - `DevOps`
  - `QA`
  - `Tester`
- **IT Terminology & Acronyms:**
  - `API`
  - `UI`
  - `UX`
  - `CI/CD`
  - `SDK`
  - `JWT`
  - `OTP`
  - `AI`
  - `LLM`
  - `CV`
  - `JD`
- **Development Concepts:**
  - `Bug`
  - `Feature`
  - `Deploy`
  - `Commit`
  - `Merge`
  - `Push`
  - `Pull`
- **File Extensions:**
  - `PDF`
  - `DOCX`
  - `CSV`
  - `SVG`
  - `PNG`
  - `JPG`
  - `JPEG`
  - `MP4`
- **General:**
  - `FAQ`

---

_Note: To ensure this rule is permanently enforced, an automated test script (`scripts/test-i18n-rules.cjs`) runs in the CI/CD pipeline (`pnpm validate`). This script will fail the build if any Dev or AI violates the above rules by putting these terms into translation files._
