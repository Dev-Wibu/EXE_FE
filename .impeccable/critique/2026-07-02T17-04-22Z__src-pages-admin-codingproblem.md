---
target: trang quản lý của vòng coding
total_score: 20
p0_count: 1
p1_count: 1
timestamp: 2026-07-02T17-04-22Z
slug: src-pages-admin-codingproblem
---

Method: dual-agent (A: 7b934ff8-93c5-423f-a61b-136876b76fb1 · B: 7cc3a5a5-11b8-47d7-b843-d7bad1f5cb57)

### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                           |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Generally clear active states and tabs.                             |
| 2         | Match System / Real World       | 3         | Good use of terminology (Test Cases, Code Stubs).                   |
| 3         | User Control and Freedom        | 3         | Standard navigation works well.                                     |
| 4         | Consistency and Standards       | 2         | Visual mismatch between highly decorative AI modal and standard UI. |
| 5         | Error Prevention                | 2         | Lacks inline validation; relies on save-time checks.                |
| 6         | Recognition Rather Than Recall  | 1         | Hiding "Param Types" forces heavy recall when filling out examples. |
| 7         | Flexibility and Efficiency      | 2         | High click-tax for editing test cases; no keyboard accelerators.    |
| 8         | Aesthetic and Minimalist Design | 1         | Tiny uppercase eyebrows everywhere cause unnecessary visual noise.  |
| 9         | Error Recovery                  | 2         | Generic toast error messages.                                       |
| 10        | Help and Documentation          | 1         | Empty state hints are sparse and unhelpful.                         |
| **Total** |                                 | **20/40** | **Poor (Requires significant improvements)**                        |

### Anti-Patterns Verdict

**LLM assessment**: Strong AI slop indicators are present. The most egregious is the widespread use of `text-[10px] font-bold uppercase tracking-wider` and `text-[11px]` for section labels and form fields. The AI Generation Modal also uses gratuitous decoration (`blur-3xl`, `bg-white/10`, gradients, hover "shines") that feels entirely out of place for a restrained admin product UI.

**Deterministic scan**: The Impeccable CLI detector identified **6 total findings** (`ai-color-palette` and `gray-on-color`). However, manual review confirms these are **false positives**. The `gray-on-color` flags missed JS scope (ternary branches) and hover overrides, meaning gray text is never actually rendered on colored backgrounds. The `ai-color-palette` flag accurately found purple gradients, but in this specific context (an AI Generation modal), it is a deliberate and functional choice to signal AI functionality.

**Visual overlays**: Skipped. No authenticated browser session available for overlay injection (fell back to CLI detector and static analysis).

### Overall Impression

The interface has a solid structural backbone (chunking complex data into tabs), but the execution suffers from severe cognitive overload and AI scaffolding tropes. The tiny typography causes eye strain, and burying critical configuration (Param Types) in a settings modal breaks the core workflow.

### What's Working

1. **Clear Structural Organization**: Dividing the complex problem editor into distinct tabs (General, Test Cases, Code Stubs) successfully chunks a massive amount of data.
2. **Type Badges**: The `TypeTag` component visually anchors data types (e.g., integer, string[]), making it much easier to parse technical parameters at a glance.

### Priority Issues

- **[P0] Hidden Core Configuration**: Param Types and Return Type are critical to defining a problem but are buried in a generic Settings modal.
  _Why it matters_: Violates "Context Switch" and "Working Memory" rules. Users shouldn't have to hunt for what inputs their problem requires.
  _Fix_: Move Param Types and Return Type directly into the main "Đề bài" (General) tab.
  _Suggested command_: `$impeccable layout`

- **[P1] Illegible Typography & AI Tells**: Rampant use of `text-[10px]` and `text-[11px] uppercase tracking-wider` across the UI.
  _Why it matters_: Causes eye strain, ruins hierarchy, and screams "AI-generated scaffold."
  _Fix_: Replace all tiny uppercase labels with standard `text-sm font-medium` sentence-case labels.
  _Suggested command_: `$impeccable typeset`

- **[P2] High Interaction Cost for Test Cases**: Test cases are hidden inside accordions requiring clicks to expand, edit, and collapse.
  _Why it matters_: To edit multiple test cases, the user suffers a massive click-tax.
  _Fix_: Display test cases in a denser, flat table or grid format when in edit mode.
  _Suggested command_: `$impeccable shape`

- **[P2] Out-of-place Decorative AI Modal**: The AI generation modal uses background blurs, gradients, and a hover "shine" effect.
  _Why it matters_: A product UI should be utilitarian and restrained. These consumer-marketing effects create an inconsistent, untrustworthy feel in an admin tool.
  _Fix_: Strip the gradients, blurs, and shine effects. Style it as a standard, clean admin dialog.
  _Suggested command_: `$impeccable quieter`

### Persona Red Flags

- **Alex (Power User)**: Frustrated by the lack of keyboard shortcuts and the multi-click process required to configure Param Types and edit individual test cases.
- **Sam (Accessibility-Dependent User)**: The use of `text-[10px]` is completely illegible for users with low vision and fails WCAG minimum size guidelines.
- **Jordan (First-Timer)**: Will not realize they need to click the generic "Settings" gear icon to define the parameters before they can add examples. Will abandon the task when trying to figure out how to input data.

### Minor Observations

- The code stub editor hardcodes the `vs-dark` theme, which clashes jarringly if the rest of the application is viewed in light mode.
- "Cài đặt Param Types trong phần Cài đặt" is an unhelpful empty state message.

### Questions to Consider

- "Why are we hiding the most important part of a coding problem (its inputs and outputs) inside a generic settings modal?"
- "Does an admin dashboard really need glowing, blurred gradients and shining buttons, or should it just let the user get their work done?"
