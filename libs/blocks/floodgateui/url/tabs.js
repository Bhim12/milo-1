import { html, signal, useEffect, useMemo } from '../../../deps/htm-preact.js';
import { setActions, openWord, handleAction } from './index.js';

function useSignal(value) {
  return useMemo(() => signal(value), []);
}

function Actions({ item, suffix }) {
  const isExcel = item.value.path.endsWith('.json') ? ' fgui-url-action-edit-excel' : ' fgui-url-action-edit-word';
  return html`
    <div class=fgui-url-source-actions>
      <button
        disabled=${item.value.edit?.status === 404}
        class="fgui-url-action fgui-url-action-edit${isExcel}"
        onClick=${(e) => { openWord(e, item, suffix); }}>Edit</button>
      <button
        disabled=${item.value.preview?.status !== 200}
        class="fgui-url-action fgui-url-action-view"
        onClick=${() => { handleAction(item.value.preview.url); }}>Preview</button>
      <button
        disabled=${item.value.live?.status !== 200}
        class="fgui-url-action fgui-url-action-view"
        onClick=${() => { handleAction(item.value.live.url); }}>Live</button>
    </div>
  `;
}

function Details({ item }) {
  return html`
    <div class=fgui-url-source-details>
      <div class=fgui-url-source-details-col>
        <h3>Modified</h3>
        <p class=fgui-url-source-details-date>
          ${item.value.edit.modified[0]}
        </p>
        <p class=fgui-url-source-details-time>
          ${item.value.edit.modified[1]}
        </p>
      </div>
      <div class=fgui-url-source-details-col>
        <h3>Previewed</h3>
        <p>${item.value.preview.modified[0]}</p>
        <p>${item.value.preview.modified[1]}</p>
      </div>
      <div class=fgui-url-source-details-col>
        <h3>Published</h3>
        <p>${item.value.live.modified[0]}</p>
        <p>${item.value.live.modified[1]}</p>
      </div>
    </div>
  `;
}

function setTab(tabs, active) {
  tabs.value = tabs.value.map((tab) => {
    const selected = tab.title === active.title;
    return { ...tab, selected };
  });
}

function setPanel(title, item, suffix) {
  switch (title) {
    case 'Actions':
      return html`<${Actions} item=${item} suffix=${suffix} />`;
    case 'Details':
      return html`<${Details} item=${item} />`;
    default:
      return html`<p>No matching panel.</p>`;
  }
}

function TabButton({ tabs, tab, idx }) {
  const id = `tab-${idx + 1}`;
  const selected = tab.selected === true;
  return html`
    <button
      id=${id}
      class=fgui-url-tab-button
      key=${tab.title}
      aria-selected=${selected}
      onClick=${() => setTab(tabs, tab)}>
      ${tab.title}
    </button>`;
}

function TabPanel({ tab, idx, item, suffix }) {
  const id = `panel-${idx + 1}`;
  const labeledBy = `tab-${idx + 1}`;
  const selected = tab.selected === true;

  return html`
    <div
      id=${id}
      class=fgui-tab-panel
      aria-labelledby=${labeledBy}
      key=${tab.title}
      aria-selected=${selected}
      role="tabpanel">
      ${setPanel(tab.title, item, suffix)}
    </div>`;
}

export default function Tabs({ suffix, path, idx }) {
  const tabs = useSignal([
    { title: 'Actions', selected: true },
    { title: 'Details' },
  ]);

  const item = useSignal({ path });

  useEffect(() => { setActions(item, suffix, idx); }, [item, idx]);
  return html`
    <div class=fgui-tabs>
      <div class=fgui-tab-buttons>
        ${tabs.value.map((tab, idx) => html`<${TabButton} tabs=${tabs} tab=${tab} idx=${idx} />`)}
        <span class=fgui-tab-buttons-suffix>(${suffix})</span>
      </div>
      <div class=fgui-tab-content>
        ${item.value.preview && html`
          ${tabs.value.map((tab, idx) => html`<${TabPanel} tab=${tab} idx=${idx} item=${item} suffix=${suffix}/>`)}
        `}
      </div>
    </div>
  `;
}