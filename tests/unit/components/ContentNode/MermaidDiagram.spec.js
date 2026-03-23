/**
 * This source file is part of the Swift.org open source project
 *
 * Copyright (c) 2024 Apple Inc. and the Swift project authors
 * Licensed under Apache License v2.0 with Runtime Library Exception
 *
 * See https://swift.org/LICENSE.txt for license information
 * See https://swift.org/CONTRIBUTORS.txt for Swift project authors
 */

import { shallowMount } from '@vue/test-utils';
import MermaidDiagram from '@/components/ContentNode/MermaidDiagram.vue';

const mockSvg = '<svg><text>diagram</text></svg>';

jest.mock('mermaid', () => ({
  default: {
    initialize: jest.fn(),
    render: jest.fn().mockResolvedValue({ svg: mockSvg }),
  },
}));

describe('MermaidDiagram', () => {
  it('renders SVG after mount', async () => {
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B' },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="img"]').exists()).toBe(true);
  });

  it('passes dark theme when isDark is true', async () => {
    const mermaid = (await import('mermaid')).default;
    shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B', isDark: true },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' }),
    );
  });

  it('shows fallback pre on render error', async () => {
    const mermaid = (await import('mermaid')).default;
    mermaid.render.mockRejectedValueOnce(new Error('parse error'));
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'invalid mermaid' },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('pre.mermaid-fallback').exists()).toBe(true);
  });

  it('uses provided alt text as aria-label', async () => {
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B', alt: 'Flow diagram' },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Flow diagram"]').exists()).toBe(true);
  });
});
