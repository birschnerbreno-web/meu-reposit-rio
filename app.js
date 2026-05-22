// ── CONFIGURAÇÃO ──────────────────────────────────────────
const SENHA = "Breno.1103";

// ── AUTH ───────────────────────────────────────────────────
function entrar() {
  const val = document.getElementById("login-input").value;
  if (val === SENHA) {
    localStorage.setItem("painel_auth", "1");
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("app-screen").classList.add("active");
    carregarTudo();
  } else {
    document.getElementById("login-erro").textContent = "Senha incorreta.";
    document.getElementById("login-input").value = "";
    document.getElementById("login-input").focus();
  }
}

function sair() {
  localStorage.removeItem("painel_auth");
  document.getElementById("app-screen").classList.remove("active");
  document.getElementById("login-screen").classList.add("active");
  document.getElementById("login-input").value = "";
}

document.getElementById("login-input").addEventListener("keydown", e => {
  if (e.key === "Enter") entrar();
});

if (localStorage.getItem("painel_auth") === "1") {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");
  carregarTudo();
}

// ── ABAS ───────────────────────────────────────────────────
function mostrarAba(nome, btn) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("aba-" + nome).classList.add("active");
  if (btn) btn.classList.add("active");
}

// ── STORAGE ────────────────────────────────────────────────
function salvar(chave, dados) {
  localStorage.setItem("painel_" + chave, JSON.stringify(dados));
}

function carregar(chave, padrao) {
  const v = localStorage.getItem("painel_" + chave);
  return v ? JSON.parse(v) : padrao;
}

// ── KANBAN ─────────────────────────────────────────────────
let colunas = [];
let cards = [];
let draggedCardId = null;
let addingCardInColuna = null;
let addingColuna = false;

const COR_COLUNAS = ["#6c63ff", "#ffb86c", "#50fa7b", "#ff5370", "#8be9fd", "#c084fc"];

function initKanban() {
  colunas = carregar("colunas", [
    { id: 1, nome: "A Fazer", cor: "#6c63ff" },
    { id: 2, nome: "Em Andamento", cor: "#ffb86c" },
    { id: 3, nome: "Concluído", cor: "#50fa7b" }
  ]);
  cards = carregar("cards", []);
  renderKanban();
}

function mostrarAddColuna() {
  addingColuna = true;
  addingCardInColuna = null;
  renderKanban();
  const input = document.getElementById("new-col-input");
  if (input) input.focus();
}

function confirmarAddColuna() {
  const input = document.getElementById("new-col-input");
  const nome = input ? input.value.trim() : "";
  if (nome) {
    const cor = COR_COLUNAS[colunas.length % COR_COLUNAS.length];
    colunas.push({ id: Date.now(), nome, cor });
    salvar("colunas", colunas);
  }
  addingColuna = false;
  renderKanban();
}

function cancelarAddColuna() {
  addingColuna = false;
  renderKanban();
}

function deletarColuna(id) {
  if (!confirm("Deletar esta coluna e todos os seus cards?")) return;
  colunas = colunas.filter(c => c.id !== id);
  cards = cards.filter(c => c.colunaId !== id);
  salvar("colunas", colunas);
  salvar("cards", cards);
  renderKanban();
}

function mostrarAddCard(colunaId) {
  addingCardInColuna = colunaId;
  renderKanban();
  const input = document.getElementById("new-card-input-" + colunaId);
  if (input) input.focus();
}

function cancelarAddCard() {
  addingCardInColuna = null;
  renderKanban();
}

function confirmarAddCard(colunaId) {
  const input = document.getElementById("new-card-input-" + colunaId);
  const titulo = input ? input.value.trim() : "";
  if (titulo) {
    cards.push({ id: Date.now(), titulo, desc: "", colunaId });
    salvar("cards", cards);
  }
  addingCardInColuna = null;
  renderKanban();
}

function deletarCard(id) {
  cards = cards.filter(c => c.id !== id);
  salvar("cards", cards);
  renderKanban();
}

function dragStart(e, cardId) {
  draggedCardId = cardId;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => {
    const el = document.getElementById("card-" + cardId);
    if (el) el.classList.add("dragging");
  }, 0);
}

function dragEnd(cardId) {
  const el = document.getElementById("card-" + cardId);
  if (el) el.classList.remove("dragging");
}

function dragOver(e, colunaId) {
  e.preventDefault();
  document.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
  const col = document.getElementById("col-" + colunaId);
  if (col) col.classList.add("drag-over");
}

function dragLeave(colunaId) {
  const col = document.getElementById("col-" + colunaId);
  if (col) col.classList.remove("drag-over");
}

function drop(e, colunaId) {
  e.preventDefault();
  document.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
  if (draggedCardId === null) return;
  const card = cards.find(c => c.id === draggedCardId);
  if (card) { card.colunaId = colunaId; salvar("cards", cards); }
  draggedCardId = null;
  renderKanban();
}

function renderKanban() {
  const board = document.getElementById("kanban-board");
  let html = colunas.map(col => {
    const colCards = cards.filter(c => c.colunaId === col.id);
    const showForm = addingCardInColuna === col.id;
    return `
      <div class="kanban-col" id="col-${col.id}"
        ondragover="dragOver(event,${col.id})"
        ondragleave="dragLeave(${col.id})"
        ondrop="drop(event,${col.id})">
        <div class="kanban-col-header" style="border-top:3px solid ${col.cor}">
          <span class="col-nome">${escHtml(col.nome)}</span>
          <span class="col-count">${colCards.length}</span>
          <button class="del-btn" onclick="deletarColuna(${col.id})">×</button>
        </div>
        <div class="kanban-cards">
          ${colCards.map(card => `
            <div class="kanban-card" id="card-${card.id}" draggable="true"
              ondragstart="dragStart(event,${card.id})"
              ondragend="dragEnd(${card.id})">
              <div class="card-titulo">${escHtml(card.titulo)}</div>
              ${card.desc ? `<div class="card-desc">${escHtml(card.desc)}</div>` : ""}
              <div class="card-footer">
                <button class="del-btn" onclick="deletarCard(${card.id})">× Remover</button>
              </div>
            </div>
          `).join("")}
        </div>
        ${showForm ? `
          <div class="add-card-form">
            <textarea id="new-card-input-${col.id}" placeholder="Título do card..."
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();confirmarAddCard(${col.id})}"
              rows="3"></textarea>
            <div class="add-card-actions">
              <button class="btn-confirm" onclick="confirmarAddCard(${col.id})">Adicionar</button>
              <button class="btn-cancel" onclick="cancelarAddCard()">Cancelar</button>
            </div>
          </div>
        ` : `
          <button class="add-card-btn" onclick="mostrarAddCard(${col.id})">+ Adicionar card</button>
        `}
      </div>
    `;
  }).join("");

  if (addingColuna) {
    html += `
      <div class="kanban-add-col">
        <div class="add-col-form">
          <input id="new-col-input" placeholder="Nome da coluna..."
            onkeydown="if(event.key==='Enter')confirmarAddColuna();if(event.key==='Escape')cancelarAddColuna()" />
          <div class="add-card-actions">
            <button class="btn-confirm" onclick="confirmarAddColuna()">Criar</button>
            <button class="btn-cancel" onclick="cancelarAddColuna()">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="kanban-add-col" onclick="mostrarAddColuna()">
        <span style="font-size:28px;color:var(--text2)">+</span>
        <span style="font-size:13px;color:var(--text2)">Nova Coluna</span>
      </div>
    `;
  }

  board.innerHTML = html;
}

// ── NOTION NOTAS ───────────────────────────────────────────
let paginas = [];
let paginaAtiva = null;

const EMOJIS = ["📄","📝","💡","🎯","📌","🔖","📊","🗒️","✅","🧠","🌟","🔥"];

function initNotas() {
  paginas = carregar("paginas", []);
  paginaAtiva = carregar("paginaAtiva", null);
  renderSidebar();
  if (paginaAtiva && paginas.find(p => p.id === paginaAtiva)) {
    abrirPagina(paginaAtiva);
  }
}

function novaPagina() {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const p = { id: Date.now(), titulo: "", conteudo: "", emoji, atualizada: Date.now() };
  paginas.unshift(p);
  salvar("paginas", paginas);
  abrirPagina(p.id);
  renderSidebar();
  setTimeout(() => document.getElementById("editor-titulo").focus(), 50);
}

function abrirPagina(id) {
  paginaAtiva = id;
  salvar("paginaAtiva", id);
  const p = paginas.find(p => p.id === id);
  if (!p) return;

  document.getElementById("editor-vazio").style.display = "none";
  document.getElementById("editor-content").style.display = "flex";
  document.getElementById("editor-titulo").value = p.titulo;
  document.getElementById("editor-body").innerHTML = p.conteudo;

  renderSidebar();
}

function salvarPaginaAtiva() {
  if (!paginaAtiva) return;
  const p = paginas.find(p => p.id === paginaAtiva);
  if (!p) return;
  p.titulo = document.getElementById("editor-titulo").value;
  p.conteudo = document.getElementById("editor-body").innerHTML;
  p.atualizada = Date.now();
  salvar("paginas", paginas);
  renderSidebar();
}

function deletarPaginaAtiva() {
  if (!paginaAtiva) return;
  if (!confirm("Excluir esta página?")) return;
  paginas = paginas.filter(p => p.id !== paginaAtiva);
  salvar("paginas", paginas);
  paginaAtiva = null;
  salvar("paginaAtiva", null);
  document.getElementById("editor-vazio").style.display = "flex";
  document.getElementById("editor-content").style.display = "none";
  renderSidebar();
}

function renderSidebar() {
  const lista = document.getElementById("lista-paginas");
  if (!paginas.length) {
    lista.innerHTML = '<p class="sidebar-vazio">Nenhuma página ainda</p>';
    return;
  }
  lista.innerHTML = paginas.map(p => `
    <div class="pagina-item ${p.id === paginaAtiva ? "active" : ""}" onclick="abrirPagina(${p.id})">
      <span class="pagina-emoji">${p.emoji || "📄"}</span>
      <span class="pagina-titulo">${escHtml(p.titulo) || "Sem título"}</span>
      <button class="del-btn" onclick="event.stopPropagation();deletarPagina(${p.id})">×</button>
    </div>
  `).join("");
}

function deletarPagina(id) {
  if (!confirm("Excluir esta página?")) return;
  paginas = paginas.filter(p => p.id !== id);
  salvar("paginas", paginas);
  if (paginaAtiva === id) {
    paginaAtiva = null;
    salvar("paginaAtiva", null);
    document.getElementById("editor-vazio").style.display = "flex";
    document.getElementById("editor-content").style.display = "none";
  }
  renderSidebar();
}

function fmt(cmd, val) {
  document.getElementById("editor-body").focus();
  document.execCommand(cmd, false, val || null);
  salvarPaginaAtiva();
}

function inserirDivisor() {
  document.getElementById("editor-body").focus();
  document.execCommand("insertHTML", false, "<hr><br>");
  salvarPaginaAtiva();
}

function handleEditorKey(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
  }
}

// ── LINKS ─────────────────────────────────────────────────
let links = [];

function addLink() {
  const titulo = document.getElementById("link-titulo").value.trim();
  const url = document.getElementById("link-url").value.trim();
  const cat = document.getElementById("link-cat").value;
  if (!url) return;
  links.push({ id: Date.now(), nome: titulo || url, url: normalizarUrl(url), cat });
  salvar("links", links);
  document.getElementById("link-titulo").value = "";
  document.getElementById("link-url").value = "";
  renderLinks();
}

function deletarLink(id) {
  links = links.filter(l => l.id !== id);
  salvar("links", links);
  renderLinks();
}

function renderLinks() {
  const grid = document.getElementById("lista-links");
  if (!links.length) {
    grid.innerHTML = '<p class="vazio">Nenhum link ainda. Adicione um acima!</p>';
    return;
  }
  const grupos = {};
  links.forEach(l => { if (!grupos[l.cat]) grupos[l.cat] = []; grupos[l.cat].push(l); });
  let html = "";
  for (const [cat, itens] of Object.entries(grupos)) {
    html += `<div class="link-cat-header">${cat}</div>`;
    html += itens.map(l => {
      const dom = getDominio(l.url);
      return `
        <div class="link-card">
          <div class="link-favicon">
            <img src="https://www.google.com/s2/favicons?domain=${dom}&sz=32"
              onerror="this.parentElement.textContent='🔗'" />
          </div>
          <div class="link-info">
            <div class="link-nome">${escHtml(l.nome)}</div>
            <div class="link-url-text">${escHtml(dom)}</div>
          </div>
          <a href="${escHtml(l.url)}" target="_blank" class="link-abrir">Abrir</a>
          <button class="del-btn" onclick="deletarLink(${l.id})">×</button>
        </div>
      `;
    }).join("");
  }
  grid.innerHTML = html;
}

// ── UTILS ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalizarUrl(url) {
  return url.startsWith("http") ? url : "https://" + url;
}

function getDominio(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

// ── INIT ──────────────────────────────────────────────────
function carregarTudo() {
  initKanban();
  initNotas();
  links = carregar("links", []);
  renderLinks();
}
