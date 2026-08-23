<script setup lang="ts">
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { clamp } from 'lodash-es';
import { Check, Clipboard, Code2, Eye, Layers3, RotateCcw } from '@lucide/vue';
import CountField from '@/components/CountField.vue';
import RangeField from '@/components/RangeField.vue';

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
type AlignItems = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

const flexDirection = ref<FlexDirection>('row');
const justifyContent = ref<JustifyContent>('space-between');
const alignItems = ref<AlignItems>('center');
const flexWrap = ref<FlexWrap>('wrap');
const alignContent = ref('stretch');
const gap = ref(16);
const itemCount = ref(6);
const selectedItem = ref(1);
const itemOrder = ref(0);
const flexGrow = ref(0);
const flexShrink = ref(1);
const childAlignSelf = ref('auto');
const items = [
  { label: '01', title: 'Structure', color: 'coral' }, { label: '02', title: 'Alignment', color: 'violet' },
  { label: '03', title: 'Spacing', color: 'blue' }, { label: '04', title: 'Order', color: 'amber' },
  { label: '05', title: 'Flow', color: 'mint' }, { label: '06', title: 'Responsive', color: 'pink' },
  { label: '07', title: 'Balance', color: 'lavender' }, { label: '08', title: 'Adapt', color: 'sky' },
  { label: '09', title: 'Scale', color: 'coral' }, { label: '10', title: 'Rhythm', color: 'violet' },
  { label: '11', title: 'Space', color: 'blue' }, { label: '12', title: 'Finish', color: 'amber' },
];
const visibleItems = computed(() => items.slice(0, itemCount.value));
const selectedItemStyle = computed(() => ({ order: itemOrder.value, flexGrow: flexGrow.value, flexShrink: flexShrink.value, alignSelf: childAlignSelf.value }));

const previewStyle = computed(() => ({ display: 'flex', flexDirection: flexDirection.value, justifyContent: justifyContent.value, alignItems: alignItems.value, flexWrap: flexWrap.value, alignContent: alignContent.value, gap: `${gap.value}px` }));
const code = computed(() => `.container {
  display: flex;
  flex-direction: ${flexDirection.value};
  justify-content: ${justifyContent.value};
  align-items: ${alignItems.value};
  flex-wrap: ${flexWrap.value};
  align-content: ${alignContent.value};
  gap: ${gap.value}px;
}

.container > :nth-child(${selectedItem.value}) {
  order: ${itemOrder.value};
  flex-grow: ${flexGrow.value};
  flex-shrink: ${flexShrink.value};
  align-self: ${childAlignSelf.value};
}`);
const { copy, copied } = useClipboard({ source: code });
function updateGap(value: number) { gap.value = clamp(value, 0, 48); }
function updateItemCount(value: number) {
  itemCount.value = clamp(value, 1, items.length);
  selectedItem.value = Math.min(selectedItem.value, itemCount.value);
}
function reset() {
  flexDirection.value = 'row'; justifyContent.value = 'space-between'; alignItems.value = 'center';
  flexWrap.value = 'wrap'; alignContent.value = 'stretch'; gap.value = 16; itemCount.value = 6; selectedItem.value = 1;
  itemOrder.value = 0; flexGrow.value = 0; flexShrink.value = 1; childAlignSelf.value = 'auto';
}
</script>

<template>
  <div class="lesson-page">
    <section class="page-intro">
      <div>
        <div class="lesson-kicker"><span class="lesson-number">01</span> 一维布局模型</div>
        <h1>Flex 布局实验室</h1>
        <p>Flexbox 负责在一条轴线上分配空间。拖动控件，理解主轴、交叉轴与换行之间的关系。</p>
      </div>
      <button class="button button-ghost" type="button" @click="reset"><RotateCcw :size="15" /> 重置实验</button>
    </section>

    <div class="lesson-layout">
      <aside class="controls-panel panel">
        <div class="control-section">
          <div class="panel-heading"><div class="panel-icon"><Layers3 :size="17" /></div><div><h2>父元素属性</h2><p>修改 Flex 容器的 CSS</p></div></div>
          <div class="control-group">
            <div class="select-field"><div class="field-heading"><div><label for="flex-direction">flex-direction</label><p>决定主轴的方向</p></div></div><select id="flex-direction" v-model="flexDirection"><option value="row">row</option><option value="row-reverse">row-reverse</option><option value="column">column</option><option value="column-reverse">column-reverse</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="justify-content">justify-content</label><p>沿主轴分配剩余空间</p></div></div><select id="justify-content" v-model="justifyContent"><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option><option value="space-around">space-around</option><option value="space-evenly">space-evenly</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="align-items">align-items</label><p>沿交叉轴对齐子项</p></div></div><select id="align-items" v-model="alignItems"><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="baseline">baseline</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="flex-wrap">flex-wrap</label><p>空间不足时是否换行</p></div></div><select id="flex-wrap" v-model="flexWrap"><option value="nowrap">nowrap</option><option value="wrap">wrap</option><option value="wrap-reverse">wrap-reverse</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="align-content">align-content</label><p>多行内容的整体对齐</p></div></div><select id="align-content" v-model="alignContent"><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option><option value="space-around">space-around</option></select></div>
            <CountField label="items" description="容器内的子项数量" :model-value="itemCount" :min="1" :max="items.length" @update:model-value="updateItemCount" />
            <RangeField label="gap" description="子项之间的间距" :model-value="gap" :min="0" :max="48" unit="px" @update:model-value="updateGap" />
          </div>
          <div class="panel-note"><span>⌘</span><p>把 <code>flex-wrap</code> 设为 <code>wrap</code>，增加 items 后，再观察 <code>align-content</code> 的行级效果。</p></div>
        </div>
        <div class="control-section child-section">
          <div class="subsection-heading"><div class="subsection-index">02</div><div><h3>子元素属性</h3><p>选中一个 item，单独调整它</p></div></div>
          <div class="child-controls">
            <div class="select-field"><div class="field-heading"><div><label for="flex-child">target</label><p>当前正在编辑的子元素</p></div></div><select id="flex-child" v-model.number="selectedItem"><option v-for="item in visibleItems" :key="item.label" :value="Number(item.label)">item {{ item.label }} · {{ item.title }}</option></select></div>
            <CountField label="order" description="改变子项的排列顺序" :model-value="itemOrder" :min="-2" :max="3" @update:model-value="itemOrder = $event" />
            <CountField label="flex-grow" description="有剩余空间时的放大比例" :model-value="flexGrow" :min="0" :max="3" @update:model-value="flexGrow = $event" />
            <CountField label="flex-shrink" description="空间不足时的收缩比例" :model-value="flexShrink" :min="0" :max="2" @update:model-value="flexShrink = $event" />
            <div class="select-field"><div class="field-heading"><div><label for="child-align-self">align-self</label><p>覆盖容器的 align-items</p></div></div><select id="child-align-self" v-model="childAlignSelf"><option value="auto">auto</option><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="baseline">baseline</option></select></div>
          </div>
          <div class="panel-note"><span>⌘</span><p><code>align-self</code> 只影响当前选中的子元素，可以用它对比容器级的 <code>align-items</code>。</p></div>
        </div>
      </aside>

      <section class="workspace-column">
        <div class="preview-panel panel">
          <div class="preview-header"><div><div class="section-label"><Eye :size="14" /> 实时预览</div><p>容器尺寸会随窗口自适应</p></div><div class="live-pill"><span class="status-dot"></span> LIVE</div></div>
          <div class="preview-stage flex-stage"><div class="axis-label axis-main">主轴 →</div><div class="axis-label axis-cross">交叉轴 ↓</div><div class="flex-canvas" :style="previewStyle"><div v-for="item in visibleItems" :key="item.label" class="demo-item" :class="[`item-${item.color}`, { 'is-selected': Number(item.label) === selectedItem }]" :style="Number(item.label) === selectedItem ? selectedItemStyle : undefined"><small>{{ item.label }}</small><strong>{{ item.title }}</strong><span v-if="Number(item.label) === selectedItem" class="selected-mark">EDITING</span></div></div></div>
        </div>
        <div class="code-panel panel">
          <div class="code-heading"><div><div class="section-label"><Code2 :size="14" /> CSS 输出</div><p>这就是浏览器最终应用的规则</p></div><button class="button button-small" type="button" @click="copy(code)"><Check v-if="copied" :size="14" /><Clipboard v-else :size="14" /> {{ copied ? '已复制' : '复制代码' }}</button></div>
          <pre><code><span class="syntax-selector">.container</span> {
  <span class="syntax-property">display</span>: <span class="syntax-value">flex</span>;
  <span class="syntax-property">flex-direction</span>: <span class="syntax-value">{{ flexDirection }}</span>;
  <span class="syntax-property">justify-content</span>: <span class="syntax-value">{{ justifyContent }}</span>;
  <span class="syntax-property">align-items</span>: <span class="syntax-value">{{ alignItems }}</span>;
  <span class="syntax-property">flex-wrap</span>: <span class="syntax-value">{{ flexWrap }}</span>;
  <span class="syntax-property">align-content</span>: <span class="syntax-value">{{ alignContent }}</span>;
  <span class="syntax-property">gap</span>: <span class="syntax-value">{{ gap }}px</span>;
}

<span class="syntax-selector">.container &gt; :nth-child({{ selectedItem }})</span> {
  <span class="syntax-property">order</span>: <span class="syntax-value">{{ itemOrder }}</span>;
  <span class="syntax-property">flex-grow</span>: <span class="syntax-value">{{ flexGrow }}</span>;
  <span class="syntax-property">flex-shrink</span>: <span class="syntax-value">{{ flexShrink }}</span>;
  <span class="syntax-property">align-self</span>: <span class="syntax-value">{{ childAlignSelf }}</span>;
}</code></pre>
        </div>
      </section>
    </div>
  </div>
</template>
