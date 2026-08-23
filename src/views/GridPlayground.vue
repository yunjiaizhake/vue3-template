<script setup lang="ts">
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { clamp } from 'lodash-es';
import { Check, Clipboard, Code2, Eye, Grid3X3, RotateCcw } from '@lucide/vue';
import CountField from '@/components/CountField.vue';
import RangeField from '@/components/RangeField.vue';

type TrackAlignment = 'stretch' | 'start' | 'center' | 'end';
const columns = ref(3); const rows = ref(3); const columnGap = ref(16); const rowGap = ref(16); const itemCount = ref(6);
const gridAutoRows = ref('minmax(66px, auto)'); const gridAutoColumns = ref('auto');
const selectedItem = ref(1); const columnSpan = ref(1); const rowSpan = ref(1);
const justifyItems = ref<TrackAlignment>('stretch'); const alignItems = ref<TrackAlignment>('stretch'); const autoFlow = ref('row');
const justifySelf = ref<TrackAlignment>('stretch'); const childAlignSelf = ref<TrackAlignment>('stretch');
const items = [
  { label: 'A', title: 'Header', color: 'coral', className: 'grid-header' }, { label: 'B', title: 'Sidebar', color: 'violet', className: 'grid-sidebar' },
  { label: 'C', title: 'Content', color: 'blue', className: 'grid-content' }, { label: 'D', title: 'Card', color: 'amber', className: '' },
  { label: 'E', title: 'Card', color: 'mint', className: '' }, { label: 'F', title: 'Footer', color: 'pink', className: 'grid-footer' },
  { label: 'G', title: 'Card', color: 'lavender', className: '' }, { label: 'H', title: 'Card', color: 'sky', className: '' },
  { label: 'I', title: 'Overflow', color: 'coral', className: '' }, { label: 'J', title: 'Implicit', color: 'violet', className: '' },
  { label: 'K', title: 'Auto row', color: 'blue', className: '' }, { label: 'L', title: 'Last', color: 'amber', className: '' },
];
const visibleItems = computed(() => items.slice(0, itemCount.value));
const selectedItemStyle = computed(() => ({ gridColumn: `span ${Math.min(columnSpan.value, columns.value)}`, gridRow: `span ${rowSpan.value}`, justifySelf: justifySelf.value, alignSelf: childAlignSelf.value }));

const previewStyle = computed(() => ({ display: 'grid', gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows.value}, minmax(66px, 1fr))`, columnGap: `${columnGap.value}px`, rowGap: `${rowGap.value}px`, justifyItems: justifyItems.value, alignItems: alignItems.value, gridAutoRows: gridAutoRows.value, gridAutoColumns: gridAutoColumns.value, gridAutoFlow: autoFlow.value }));
const code = computed(() => `.grid {
  display: grid;
  grid-template-columns: repeat(${columns.value}, minmax(0, 1fr));
  grid-template-rows: repeat(${rows.value}, minmax(66px, 1fr));
  column-gap: ${columnGap.value}px;
  row-gap: ${rowGap.value}px;
  justify-items: ${justifyItems.value};
  align-items: ${alignItems.value};
  grid-auto-rows: ${gridAutoRows.value};
  grid-auto-columns: ${gridAutoColumns.value};
  grid-auto-flow: ${autoFlow.value};
}

.grid > :nth-child(${selectedItem.value}) {
  grid-column: span ${Math.min(columnSpan.value, columns.value)};
  grid-row: span ${rowSpan.value};
  justify-self: ${justifySelf.value};
  align-self: ${childAlignSelf.value};
}`);
const { copy, copied } = useClipboard({ source: code });
function updateColumns(value: number) { columns.value = clamp(value, 1, 4); }
function updateRows(value: number) { rows.value = clamp(value, 2, 4); }
function updateItemCount(value: number) { itemCount.value = clamp(value, 1, items.length); selectedItem.value = Math.min(selectedItem.value, itemCount.value); }
function updateColumnGap(value: number) { columnGap.value = clamp(value, 0, 40); }
function updateRowGap(value: number) { rowGap.value = clamp(value, 0, 40); }
function reset() { columns.value = 3; rows.value = 3; columnGap.value = 16; rowGap.value = 16; itemCount.value = 6; gridAutoRows.value = 'minmax(66px, auto)'; gridAutoColumns.value = 'auto'; selectedItem.value = 1; columnSpan.value = 1; rowSpan.value = 1; justifyItems.value = 'stretch'; alignItems.value = 'stretch'; autoFlow.value = 'row'; justifySelf.value = 'stretch'; childAlignSelf.value = 'stretch'; }
</script>

<template>
  <div class="lesson-page">
    <section class="page-intro">
      <div><div class="lesson-kicker"><span class="lesson-number lesson-number-violet">02</span> 二维布局模型</div><h1>Grid 布局实验室</h1><p>Grid 把页面拆成行与列。先定义轨道，再决定每个网格项如何填充这张二维画布。</p></div>
      <button class="button button-ghost" type="button" @click="reset"><RotateCcw :size="15" /> 重置实验</button>
    </section>
    <div class="lesson-layout">
      <aside class="controls-panel panel">
        <div class="control-section">
          <div class="panel-heading"><div class="panel-icon panel-icon-violet"><Grid3X3 :size="17" /></div><div><h2>父元素属性</h2><p>定义 Grid 容器的规则</p></div></div>
          <div class="control-group">
            <CountField label="columns" description="网格列的数量" :model-value="columns" :min="1" :max="4" @update:model-value="updateColumns" />
            <CountField label="rows" description="网格行的数量" :model-value="rows" :min="2" :max="4" @update:model-value="updateRows" />
            <CountField label="items" description="网格项的数量" :model-value="itemCount" :min="1" :max="items.length" @update:model-value="updateItemCount" />
            <RangeField label="column-gap" description="列轨道之间的间距" :model-value="columnGap" :min="0" :max="40" unit="px" @update:model-value="updateColumnGap" />
            <RangeField label="row-gap" description="行轨道之间的间距" :model-value="rowGap" :min="0" :max="40" unit="px" @update:model-value="updateRowGap" />
            <div class="select-field"><div class="field-heading"><div><label for="justify-items">justify-items</label><p>网格项在列轨道内对齐</p></div></div><select id="justify-items" v-model="justifyItems"><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="grid-align-items">align-items</label><p>网格项在行轨道内对齐</p></div></div><select id="grid-align-items" v-model="alignItems"><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="grid-auto-flow">grid-auto-flow</label><p>自动放置网格项的方向</p></div></div><select id="grid-auto-flow" v-model="autoFlow"><option value="row">row</option><option value="column">column</option><option value="row dense">row dense</option><option value="column dense">column dense</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="grid-auto-rows">grid-auto-rows</label><p>隐式行的尺寸规则</p></div></div><select id="grid-auto-rows" v-model="gridAutoRows"><option value="minmax(66px, auto)">minmax(66px, auto)</option><option value="96px">96px</option><option value="140px">140px</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="grid-auto-columns">grid-auto-columns</label><p>隐式列的尺寸规则</p></div></div><select id="grid-auto-columns" v-model="gridAutoColumns"><option value="auto">auto</option><option value="96px">96px</option><option value="140px">140px</option></select></div>
          </div>
          <div class="panel-note panel-note-violet"><span>⌘</span><p>增加 items 超过 <code>columns × rows</code>，后面的元素会进入隐式轨道。</p></div>
        </div>
        <div class="control-section child-section">
          <div class="subsection-heading"><div class="subsection-index subsection-index-violet">02</div><div><h3>子元素属性</h3><p>选中一个 item，单独调整它</p></div></div>
          <div class="child-controls">
            <div class="select-field"><div class="field-heading"><div><label for="grid-child">target</label><p>当前正在编辑的网格项</p></div></div><select id="grid-child" v-model.number="selectedItem"><option v-for="(item, index) in visibleItems" :key="item.label" :value="index + 1">item {{ item.label }} · {{ item.title }}</option></select></div>
            <CountField label="column span" description="横向占用几条轨道" :model-value="columnSpan" :min="1" :max="4" @update:model-value="columnSpan = $event" />
            <CountField label="row span" description="纵向占用几条轨道" :model-value="rowSpan" :min="1" :max="3" @update:model-value="rowSpan = $event" />
            <div class="select-field"><div class="field-heading"><div><label for="grid-justify-self">justify-self</label><p>子项在列轨道内对齐</p></div></div><select id="grid-justify-self" v-model="justifySelf"><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            <div class="select-field"><div class="field-heading"><div><label for="grid-child-align-self">align-self</label><p>子项在行轨道内对齐</p></div></div><select id="grid-child-align-self" v-model="childAlignSelf"><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
          </div>
          <div class="panel-note panel-note-violet"><span>⌘</span><p>子元素的 <code>align-self</code> 会覆盖父容器的 <code>align-items</code>，只影响当前选中项。</p></div>
        </div>
      </aside>
      <section class="workspace-column">
        <div class="preview-panel panel">
          <div class="preview-header"><div><div class="section-label"><Eye :size="14" /> 实时预览</div><p>每个色块都是一个独立的 grid item</p></div><div class="grid-legend"><span><i class="legend-swatch explicit-swatch"></i>显式轨道</span><span><i class="legend-swatch implicit-swatch"></i>隐式轨道</span><div class="live-pill"><span class="status-dot"></span> LIVE</div></div></div>
          <div class="preview-stage grid-stage"><div class="grid-canvas" :style="previewStyle"><div v-for="(item, index) in visibleItems" :key="item.label" class="demo-item grid-item" :class="[`item-${item.color}`, item.className, { 'is-implicit': index >= rows * columns, 'is-selected': index + 1 === selectedItem }]" :style="index + 1 === selectedItem ? selectedItemStyle : undefined"><small>{{ item.label }}</small><strong>{{ item.title }}</strong><span class="grid-kind">{{ index >= rows * columns ? 'implicit' : 'explicit' }}</span><span v-if="index + 1 === selectedItem" class="selected-mark">EDITING</span></div></div></div>
        </div>
        <div class="code-panel panel">
          <div class="code-heading"><div><div class="section-label"><Code2 :size="14" /> CSS 输出</div><p>从布局逻辑到可复制的代码</p></div><button class="button button-small" type="button" @click="copy(code)"><Check v-if="copied" :size="14" /><Clipboard v-else :size="14" /> {{ copied ? '已复制' : '复制代码' }}</button></div>
          <pre><code><span class="syntax-selector">.grid</span> {
  <span class="syntax-property">display</span>: <span class="syntax-value">grid</span>;
  <span class="syntax-property">grid-template-columns</span>: <span class="syntax-value">repeat({{ columns }}, minmax(0, 1fr))</span>;
  <span class="syntax-property">grid-template-rows</span>: <span class="syntax-value">repeat({{ rows }}, minmax(66px, 1fr))</span>;
  <span class="syntax-property">column-gap</span>: <span class="syntax-value">{{ columnGap }}px</span>;
  <span class="syntax-property">row-gap</span>: <span class="syntax-value">{{ rowGap }}px</span>;
  <span class="syntax-property">justify-items</span>: <span class="syntax-value">{{ justifyItems }}</span>;
  <span class="syntax-property">align-items</span>: <span class="syntax-value">{{ alignItems }}</span>;
  <span class="syntax-property">grid-auto-rows</span>: <span class="syntax-value">{{ gridAutoRows }}</span>;
  <span class="syntax-property">grid-auto-columns</span>: <span class="syntax-value">{{ gridAutoColumns }}</span>;
  <span class="syntax-property">grid-auto-flow</span>: <span class="syntax-value">{{ autoFlow }}</span>;
}

<span class="syntax-selector">.grid &gt; :nth-child({{ selectedItem }})</span> {
  <span class="syntax-property">grid-column</span>: <span class="syntax-value">span {{ Math.min(columnSpan, columns) }}</span>;
  <span class="syntax-property">grid-row</span>: <span class="syntax-value">span {{ rowSpan }}</span>;
  <span class="syntax-property">justify-self</span>: <span class="syntax-value">{{ justifySelf }}</span>;
  <span class="syntax-property">align-self</span>: <span class="syntax-value">{{ childAlignSelf }}</span>;
}</code></pre>
        </div>
      </section>
    </div>
  </div>
</template>
