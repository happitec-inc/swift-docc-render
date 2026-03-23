<!--
  This source file is part of the Swift.org open source project

  Copyright (c) 2024 Apple Inc. and the Swift project authors
  Licensed under Apache License v2.0 with Runtime Library Exception

  See https://swift.org/LICENSE.txt for license information
  See https://swift.org/CONTRIBUTORS.txt for Swift project authors
-->

<template>
  <figure class="mermaid-diagram">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="rendered" role="img" :aria-label="alt || 'Mermaid diagram'" v-html="rendered" />
    <pre v-else class="mermaid-fallback">{{ code }}</pre>
  </figure>
</template>

<script>
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
    };
  },
  watch: {
    code() {
      this.renderDiagram();
    },
    isDark() {
      this.renderDiagram();
    },
  },
  mounted() {
    this.renderDiagram();
  },
  methods: {
    async renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: this.isDark ? 'dark' : 'default',
        });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, this.code);
        this.rendered = svg;
      } catch (e) {
        this.rendered = null;
      }
    },
  },
};
</script>

<style scoped>
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
