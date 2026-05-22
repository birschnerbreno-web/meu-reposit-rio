// ── CONFIGURAÇÃO ──────────────────────────────────────────
// Troque a senha abaixo antes de publicar
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

// Verificar se já está logado
if (localStorage.getItem("painel_auth") === "1") {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");
  carregarTudo();
}

// ── ABAS ───────────────────────────────────────────────────
function mostrarAba(nome) {
  document.querySelectorAll(".aba").forEach(a => a.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("aba-" + nome).classList.add("active");
  event.target.classList.add("active");
}

// ── STORAGE ────────────────────────────────────────────────
function salvar(chave, dados) {
  localStorage.setItem("painel_" + chave, JSON.stringify(dados));
}

function carregar(chave, padrao) {
  const v = localStorage.getItem("painel_" + chave);
  return v ? JSON.parse(v) : padrao;
}

// ── TAREFAS ────────────────────────────────────────────────
let tarefas = [];

function addTarefa() {
  const input = document.getElementById("tarefa-input");
  const cat = document.getElementById("tarefa-cat").value;
  const texto = input.value.trim();
  if (!texto) return;
  tarefas.push({ id: Date.now(), texto, cat, feita: false });
  salvar("tarefas", tarefas);
  input.value = "";
  renderTarefas();
}

function toggleTarefa(id) {
  const t = tarefas.find(t => t.id === id);
  if (t) t.feita = !t.feita;
  salvar("tarefas", tarefas);
  renderTarefas();
}

function deletarTarefa(id) {
  tarefas = tarefas.filter(t => t.id !== id);
  salvar("tarefas", tarefas);
  renderTarefas();
}

function renderTarefas() {
  const lista = document.getElementById("lista-tarefas");
  if (!tarefas.length) {
    lista.innerHTML = '<p class="vazio">Nenhuma tarefa ainda. Adicione uma acima!</p>';
    return;
  }
  const pendentes = tarefas.filter(t => !t.feita);
  const feitas = tarefas.filter(t => t.feita);
  const ordenadas = [...pendentes, ...feitas];
  lista.innerHTML = ordenadas.map(t => `
    <div class="tarefa-item ${t.feita ? "feita" : ""}">
      <input type="checkbox" ${t.feita ? "checked" : ""} onchange="toggleTarefa(${t.id})" />
      <span class="tarefa-texto">${escHtml(t.texto)}</span>
      <span class="tag tag-${t.cat}">${t.cat}</span>
      <button class="del-btn" onclick="deletarTarefa(${t.id})" title="Remover">×</button>
    </div>
  `).join("");
}

// ── NOTAS ─────────────────────────────────────────────────
let notas = [];

function novaNota() {
  const nota = { id: Date.now(), titulo: "", conteudo: "", atualizada: Date.now() };
  notas.unshift(nota);
  salvar("notas", notas);
  renderNotas();
}

function atualizarNota(id, campo, valor) {
  const n = notas.find(n => n.id === id);
  if (n) { n[campo] = valor; n.atualizada = Date.now(); }
  salvar("notas", notas);
}

function deletarNota(id) {
  notas = notas.filter(n => n.id !== id);
  salvar("notas", notas);
  renderNotas();
}

function renderNotas() {
  const grid = document.getElementById("lista-notas");
  if (!notas.length) {
    grid.innerHTML = '<p class="vazio">Nenhuma nota ainda. Clique em "+ Nova Nota"!</p>';
    return;
  }
  grid.innerHTML = notas.map(n => `
    <div class="nota-card">
      <input class="nota-titulo" value="${escHtml(n.titulo)}" placeholder="Título..."
        oninput="atualizarNota(${n.id}, 'titulo', this.value)" />
      <textarea class="nota-conteudo" placeholder="Escreva aqui..."
        oninput="atualizarNota(${n.id}, 'conteudo', this.value)">${escHtml(n.conteudo)}</textarea>
      <div class="nota-footer">
        <span>${formatarData(n.atualizada)}</span>
        <button class="del-btn" onclick="deletarNota(${n.id})" title="Remover">× Excluir</button>
      </div>
    </div>
  `).join("");
}

// ── LINKS ─────────────────────────────────────────────────
let links = [];

function addLink() {
  const titulo = document.getElementById("link-titulo").value.trim();
  const url = document.getElementById("link-url").value.trim();
  const cat = document.getElementById("link-cat").value;
  if (!url) return;
  const nome = titulo || url;
  links.push({ id: Date.now(), nome, url: normalizarUrl(url), cat });
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
  links.forEach(l => {
    if (!grupos[l.cat]) grupos[l.cat] = [];
    grupos[l.cat].push(l);
  });
  let html = "";
  for (const [cat, itens] of Object.entries(grupos)) {
    html += `<div style="grid-column:1/-1"><h3 style="color:var(--text2);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${cat}</h3></div>`;
    html += itens.map(l => {
      const dominio = getDominio(l.url);
      return `
        <div class="link-card">
          <div class="link-favicon">
            <img src="https://www.google.com/s2/favicons?domain=${dominio}&sz=32"
              onerror="this.parentElement.textContent='🔗'" />
          </div>
          <div class="link-info">
            <div class="link-nome">${escHtml(l.nome)}</div>
            <div class="link-url-text">${escHtml(dominio)}</div>
          </div>
          <a href="${escHtml(l.url)}" target="_blank" class="link-abrir">Abrir</a>
          <button class="del-btn" onclick="deletarLink(${l.id})" title="Remover">×</button>
        </div>
      `;
    }).join("");
  }
  grid.innerHTML = html;
}

// ── UTILS ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizarUrl(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return "https://" + url;
  return url;
}

function getDominio(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function formatarData(ts) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── INIT ──────────────────────────────────────────────────
function carregarTudo() {
  tarefas = carregar("tarefas", []);
  notas = carregar("notas", []);
  links = carregar("links", []);
  renderTarefas();
  renderNotas();
  renderLinks();
}
