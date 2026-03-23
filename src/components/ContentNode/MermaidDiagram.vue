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

.mermaid-fallback {
  background: var(--color-fill-secondary, #f5f5f7);
  border-radius: 4px;
  padding: 1em;
  font-size: 0.875em;
  white-space: pre-wrap;
}
</style>
