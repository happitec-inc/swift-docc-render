<!--
  This source file is part of the Swift.org open source project

  Copyright (c) 2024-2025 Apple Inc. and the Swift project authors
  Licensed under Apache License v2.0 with Runtime Library Exception

  See https://swift.org/LICENSE.txt for license information
  See https://swift.org/CONTRIBUTORS.txt for Swift project authors
-->

<template>
  <div class="mermaid-diagram">
    <!--
      v-html is safe here: mermaid.render() runs its own DOMPurify sanitization,
      and we set securityLevel: 'strict' during initialization.
    -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      v-if="rendered"
      role="img"
      :aria-label="alt || 'Mermaid diagram'"
      :style="diagramStyle"
      v-html="rendered"
    />
    <pre
      v-else
      class="mermaid-fallback"
      role="img"
      aria-label="Diagram could not be rendered"
    >{{ code }}</pre>
  </div>
</template>

<script>
import AppStore from 'docc-render/stores/AppStore';
import ColorScheme from 'docc-render/constants/ColorScheme';

export default {
  name: 'MermaidDiagram',
  props: {
    code: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: null,
    },
    isDark: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      rendered: null,
      renderGeneration: 0,
      lastInitializedTheme: null,
      diagramStyle: null,
    };
  },
  computed: {
    effectiveIsDark() {
      if (this.isDark) return true; // testing override
      const { preferredColorScheme, systemColorScheme } = AppStore.state;
      return preferredColorScheme === ColorScheme.auto
        ? systemColorScheme === ColorScheme.dark
        : preferredColorScheme === ColorScheme.dark;
    },
  },
  watch: {
    code() {
      this.renderDiagram();
    },
    effectiveIsDark() {
      this.renderDiagram();
    },
  },
  mounted() {
    this.renderDiagram();
  },
  methods: {
    async renderDiagram() {
      this.renderGeneration += 1;
      const gen = this.renderGeneration;
      try {
        const mermaid = (await import('mermaid')).default;
        const theme = this.effectiveIsDark ? 'dark' : 'default';
        if (this.lastInitializedTheme !== theme) {
          mermaid.initialize({
            startOnLoad: false,
            theme,
            securityLevel: 'strict',
          });
          this.lastInitializedTheme = theme;
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, this.code);
        if (gen !== this.renderGeneration) return;
        this.rendered = svg;
        this.$nextTick(() => {
          if (gen !== this.renderGeneration) return;
          const svgEl = this.$el && this.$el.querySelector('svg');
          if (!svgEl) return;
          const vb = svgEl.getAttribute('viewBox');
          if (vb) {
            const parts = vb.trim().split(/[\s,]+/);
            const w = parseFloat(parts[2]);
            const h = parseFloat(parts[3]);
            const container = svgEl.closest('.mermaid-diagram');
            const isLandscape = !Number.isNaN(w) && !Number.isNaN(h) && w > h;
            if (container) {
              container.classList.toggle('is-landscape', isLandscape);
            }
            if (!isLandscape && !Number.isNaN(w)) {
              // Portrait/square: scale up to 2× natural width, but cap at 80% of container.
              this.diagramStyle = { width: `min(80%, ${Math.round(w * 2)}px)` };
            } else {
              this.diagramStyle = null;
            }
          }
        });
      } catch (e) {
        if (gen !== this.renderGeneration) return;
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[MermaidDiagram] render failed:', e);
        }
        this.rendered = null;
      }
    },
  },
};
</script>

<style scoped>
/* TODO: prefers-reduced-motion is a known accessibility gap.
   Mermaid animations should be disabled when the user prefers reduced motion. */
.mermaid-diagram {
  margin: 1em 0;
  overflow-x: auto;
}

/* Portrait/square diagrams: use natural size, capped at container width, centered. */
.mermaid-diagram > div {
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
}

.mermaid-diagram :deep(svg) {
  display: block;
  max-width: 100% !important;
  height: auto;
}

/* Landscape diagrams: stretch to fill the full column width. */
.mermaid-diagram.is-landscape > div {
  width: 100%;
}

.mermaid-diagram.is-landscape :deep(svg) {
  width: 100%;
}

.mermaid-fallback {
  background: var(--color-fill-secondary, #f5f5f7);
  border-radius: 4px;
  padding: 1em;
  font-size: 0.875em;
  white-space: pre-wrap;
}
</style>
