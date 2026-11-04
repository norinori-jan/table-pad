(() => {
  'use strict';
  if (window.__tablePadWorkspaces) return;
  window.__tablePadWorkspaces = true;

  const GOV_IDS = [
    'tpOfficialInfo', 'tpOfficialData', 'tpGsiObs', 'tpJmaObs',
    'tpEStatObs', 'tpBOJObs', 'tpMOFObs', 'tpFSAObs'
  ];
  const NEWS_IDS = ['tpnl-root', 'tpnc-open', 'tpnc-cover'];
  const TABLE_IDS = [
    'views','tabs','title','wrap','hint','bar','cv','fv','dv','lv','sv','xv','zv',
    'jqa','resource-tools','rSearch','rSummary','resource-grid'
  ];

  function init() {
    const header = document.querySelector('body > header');
    if (!header || document.getElementById('tp-workspace-nav')) return;

    const nav = document.createElement('nav');
    nav.id = 'tp-workspace-nav';
    nav.setAttribute('aria-label', '作業画面');
    nav.innerHTML = [
      '<button type="button" data-workspace="table" class="on" aria-pressed="true">▦ 表・分析</button>',
      '<button type="button" data-workspace="official" aria-pressed="false">🏛 公的データ</button>',
      '<button type="button" data-workspace="news" aria-pressed="false">🌐 ニュース</button>'
    ].join('');

    const host = document.createElement('div');
    host.id = 'tp-workspaces';
    const panes = {};
    [['table','tp-workspace-table'],['official','tp-workspace-official'],['news','tp-workspace-news']].forEach(([key,id]) => {
      const pane = document.createElement('section');
      pane.id = id;
      pane.className = 'tp-workspace';
      pane.dataset.workspace = key;
      pane.hidden = key !== 'table';
      panes[key] = pane;
      host.appendChild(pane);
    });

    header.insertAdjacentElement('afterend', nav);
    nav.insertAdjacentElement('afterend', host);

    function moveKnown(root) {
      if (!root || root === nav || root === host || root === header) return;
      if (root.id && GOV_IDS.includes(root.id)) {
        panes.official.appendChild(root);
        root.classList.add('tp-workspace-item');
        return;
      }
      if (root.id && NEWS_IDS.includes(root.id)) {
        panes.news.appendChild(root);
        root.classList.add('tp-workspace-item');
        return;
      }
      if (root.id && TABLE_IDS.includes(root.id)) {
        panes.table.appendChild(root);
        return;
      }
      if (root.nodeType === 1 && root.matches('main, #app')) {
        Array.from(root.children).forEach(moveKnown);
      }
    }

    Array.from(document.body.children).forEach(moveKnown);

    function collectLate(node) {
      if (!node || node.nodeType !== 1) return;
      if (GOV_IDS.includes(node.id) || NEWS_IDS.includes(node.id) || TABLE_IDS.includes(node.id)) {
        moveKnown(node);
        return;
      }
      if (node.children) Array.from(node.children).forEach(collectLate);
    }

    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(collectLate));
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function activate(key) {
      if (!panes[key]) return;
      Object.keys(panes).forEach(name => {
        panes[name].hidden = name !== key;
        const button = nav.querySelector('[data-workspace="' + name + '"]');
        button.classList.toggle('on', name === key);
        button.setAttribute('aria-pressed', name === key ? 'true' : 'false');
      });
      try { sessionStorage.setItem('tp_active_workspace_v1', key); } catch (_) {}
      window.dispatchEvent(new CustomEvent('tablepad:workspacechange', { detail: { workspace: key } }));
    }

    nav.addEventListener('click', event => {
      const button = event.target.closest('button[data-workspace]');
      if (button) activate(button.dataset.workspace);
    });

    let initial = 'table';
    try {
      const saved = sessionStorage.getItem('tp_active_workspace_v1');
      if (saved && panes[saved]) initial = saved;
    } catch (_) {}
    activate(initial);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();