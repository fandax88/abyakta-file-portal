# Design System Master — Abyakta Lab Repository (`file.abyakta-h.id`)

Generated & curated following **`nextlevelbuilder/ui-ux-pro-max-skill`** (`--design-system`, `styles.csv`: *Bento Box Grid* + *Minimalism & Swiss Precision* + *OLED Dark Mode*).

---

## 1. Visual Direction & Architecture
- **Product Archetype:** Developer Tool / Software Distribution Mirror & Lab File Explorer
- **Primary Style:** Precision Bento Telemetry + High-Density Technical Explorer
- **Mode Support:** Dual Theme — **OLED Midnight Dark** & **Crisp Technical Paper Light** (4.5:1+ WCAG AA verified independently per mode)
- **Design Dials:** Variance `7/10` (Asymmetric Bento overview + structured data grid) • Motion `4/10` (150–220ms GPU transform/opacity, reduced-motion safe) • Density `7/10` (Compact, scannable lab explorer)

---

## 2. Typography System (`typography.csv`: Tech Startup + Developer Mono)
- **Display & Section Headings (`font-display`):** `Space Grotesk` (`600`, `700`, tracking `-0.02em`)
- **UI Body & Controls (`font-sans`):** `IBM Plex Sans` (`400`, `500`, `600`, line-height `1.5`)
- **Metadata, Sizes, Checksums, CLI (`font-mono`):** `JetBrains Mono` (`400`, `500`, `600`, `font-variant-numeric: tabular-nums`)

---

## 3. Semantic Color Tokens

| Semantic Token | Light Mode | Dark Mode (OLED Slate) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F6F8FC` | `#060A14` | Root viewport canvas |
| `--bg-surface` | `#FFFFFF` | `#0C1222` | Primary cards, table container, modals |
| `--bg-elevated` | `#F1F5F9` | `#131C32` | Interactive hover surfaces, chips, code blocks |
| `--border-subtle` | `#E2E8F0` | `#1E293B` | Hairline structural dividers |
| `--border-strong` | `#CBD5E1` | `#334155` | Input & interactive control boundaries (≥3:1) |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Primary filenames & headings |
| `--text-secondary` | `#475569` | `#94A3B8` | Metadata, timestamps, helper text (≥4.5:1) |
| `--accent-primary` | `#2563EB` | `#3B82F6` | Primary CTA, focus rings, active indicators |
| `--accent-folder` | `#D97706` | `#F59E0B` | Directory accents |
| `--accent-editor` | `#059669` | `#10B981` | Authenticated Editor Mode status |
| `--accent-danger` | `#DC2626` | `#EF4444` | Destructive delete actions |

---

## 4. Mandatory UX & Accessibility Rules (`ui-ux-pro-max` Priority 1–10)
1. **No Emoji Icons:** Strictly crisp Lucide SVG icons (`stroke-width: 1.75`); `aria-hidden="true"` on decorative icons beside visible text; explicit `aria-label` on icon-only buttons.
2. **Color Not Alone:** File categories combine distinct SVG glyph + uppercase monospace badge + category text; filter chips include icon + label + count + `aria-pressed`.
3. **Modal Focus Lifecycle:** Native `<dialog>.showModal()` traps Tab, supports `Escape`, clears inline error on edit (`error-clears-on-fix`), supports PIN visibility toggle (`password-toggle`), and restores focus to trigger element on close.
4. **Resilient Text & Tabular Figures:** Long filenames, MD5 hashes, and CLI URLs wrap cleanly (`overflow-wrap: anywhere`); byte sizes and dates use `tabular-nums` to eliminate layout shift.
5. **Dragging Alternative:** Full-window drag-and-drop upload in Editor Mode is paired with explicit keyboard-operable upload buttons.
6. **Motion Hygiene:** Animate `transform` and `opacity` only; disable non-essential transitions under `@media (prefers-reduced-motion: reduce)`.

