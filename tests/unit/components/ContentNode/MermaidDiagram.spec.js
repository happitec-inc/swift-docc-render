/**
 * This source file is part of the Swift.org open source project
 *
 * Copyright (c) 2024-2025 Apple Inc. and the Swift project authors
 * Licensed under Apache License v2.0 with Runtime Library Exception
 *
 * See https://swift.org/LICENSE.txt for license information
 * See https://swift.org/CONTRIBUTORS.txt for Swift project authors
 */

import { shallowMount } from '@vue/test-utils';
import MermaidDiagram from '@/components/ContentNode/MermaidDiagram.vue';

const mockSvg = '<svg><text>diagram</text></svg>';

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn().mockResolvedValue({ svg: '<svg><text>diagram</text></svg>' }),
  },
}));

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// eslint-disable-next-line global-require
const getMockMermaid = () => require('mermaid').default;

describe('MermaidDiagram', () => {
  beforeEach(() => {
    const mermaid = getMockMermaid();
    mermaid.initialize.mockClear();
    mermaid.render.mockReset();
    mermaid.render.mockResolvedValue({ svg: mockSvg });
  });

  it('renders SVG after mount', async () => {
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B' },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="img"]').exists()).toBe(true);
  });

  it('passes dark theme when isDark is true', async () => {
    const mermaid = getMockMermaid();
    shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B', isDark: true },
    });
    await flushPromises();
    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' }),
    );
  });

  it('shows fallback pre on render error', async () => {
    const mermaid = getMockMermaid();
    mermaid.render.mockRejectedValueOnce(new Error('parse error'));
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'invalid mermaid' },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('pre.mermaid-fallback').exists()).toBe(true);
  });

  it('uses provided alt text as aria-label', async () => {
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B', alt: 'Flow diagram' },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-label="Flow diagram"]').exists()).toBe(true);
  });

  it('re-renders when code prop changes', async () => {
    const mermaid = getMockMermaid();
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B' },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    const callCount = mermaid.render.mock.calls.length;
    await wrapper.setProps({ code: 'graph LR\n  X --> Y' });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(mermaid.render.mock.calls.length).toBeGreaterThan(callCount);
  });

  it('shows fallback for empty code string', async () => {
    const mermaid = getMockMermaid();
    mermaid.render.mockRejectedValueOnce(new Error('empty'));
    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: '' },
    });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('pre.mermaid-fallback').exists()).toBe(true);
  });

  it('discards stale renders on rapid code changes', async () => {
    const mermaid = getMockMermaid();
    let resolveFirst;
    const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
    mermaid.render
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({ svg: '<svg>second</svg>' });

    const wrapper = shallowMount(MermaidDiagram, {
      propsData: { code: 'graph TD\n  A --> B' },
    });
    await wrapper.setProps({ code: 'graph LR\n  X --> Y' });
    await flushPromises();
    await wrapper.vm.$nextTick();

    resolveFirst({ svg: '<svg>first</svg>' });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.rendered).toBe('<svg>second</svg>');
  });
});
