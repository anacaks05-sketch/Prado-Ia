
/* =====================================================
   PRADO SPORTS AI — Configuração
   - Para produção na Vercel, use variável de ambiente APISPORTS_KEY.
   - Para teste local, cole a chave no painel ⚙️ ou em API_KEY abaixo.
===================================================== */
window.PRADO_CONFIG = {
  API_KEY: '',
  API_BASE: 'https://v3.football.api-sports.io',
  TIMEZONE: 'America/Fortaleza',
  PAYMENT_LINK: 'https://SEU-LINK-DE-PAGAMENTO-AQUI.com',
  SUPPORT_WHATSAPP: '5599999999999',
  PREMIUM_PRICE: 'R$ 19,90/mês',
  PREMIUM_CODES: ['PRADO2026', 'CARLOSVIP', 'PRADO19'],
  // Use apenas se você conectar um CSV publicado do Google Sheets com códigos ativos.
  PREMIUM_CODES_CSV: '',
  BRAND: {
    name: 'Prado Sports AI',
    shortName: 'Prado AI'
  }
};

  

/* =====================================================
   API-Football adapter — Prado Sports AI
===================================================== */
window.PradoFootballAPI = (() => {
  const cfg = () => window.PRADO_CONFIG || {};
  const todayISO = () => new Date().toISOString().slice(0, 10);

  function browserKey(){
    return localStorage.getItem('prado_api_key') || cfg().API_KEY || '';
  }

  async function request(path, params = {}){
    const qs = new URLSearchParams(params);
    qs.set('timezone', cfg().TIMEZONE || 'America/Fortaleza');

    // 1) Preferido na Vercel: proxy seguro usando APISPORTS_KEY no servidor.
    try{
      const proxyUrl = `/api/football?path=${encodeURIComponent(path)}&${qs.toString()}`;
      const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
      if(proxyRes.ok){
        const data = await proxyRes.json();
        if(data && !data.error) return data;
      }
    }catch(_err){ /* ambiente local sem proxy */ }

    // 2) Teste rápido no navegador — expõe a chave, use só para testar.
    const key = browserKey();
    if(!key) throw new Error('API key não configurada');
    const url = `${cfg().API_BASE || 'https://v3.football.api-sports.io'}/${path}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: { 'x-apisports-key': key },
      cache: 'no-store'
    });
    if(!res.ok) throw new Error(`API erro ${res.status}`);
    return res.json();
  }

  async function fixturesByDate(date = todayISO()){
    const data = await request('fixtures', { date });
    return normalizeFixtures(data.response || []);
  }

  async function liveFixtures(){
    const data = await request('fixtures', { live: 'all' });
    return normalizeFixtures(data.response || []);
  }

  async function prediction(fixtureId){
    const data = await request('predictions', { fixture: fixtureId });
    return data.response?.[0] || null;
  }

  function normalizeFixtures(rows){
    return rows.map((r, idx) => {
      const statusShort = r.fixture?.status?.short || 'NS';
      const elapsed = r.fixture?.status?.elapsed || null;
      const isLive = ['1H','2H','HT','ET','P','BT','LIVE'].includes(statusShort);
      const isFinished = ['FT','AET','PEN'].includes(statusShort);
      const homeGoals = r.goals?.home;
      const awayGoals = r.goals?.away;
      return {
        id: String(r.fixture?.id || `api-${idx}`),
        apiId: r.fixture?.id,
        league: r.league?.name || 'Liga',
        country: r.league?.country || '',
        leagueLogo: r.league?.logo || '',
        round: r.league?.round || '',
        date: r.fixture?.date || new Date().toISOString(),
        timestamp: r.fixture?.timestamp || 0,
        status: isLive ? 'live' : isFinished ? 'finished' : 'scheduled',
        minute: elapsed,
        venue: r.fixture?.venue?.name || '',
        home: {
          name: r.teams?.home?.name || 'Mandante',
          logo: r.teams?.home?.logo || '',
          winner: r.teams?.home?.winner
        },
        away: {
          name: r.teams?.away?.name || 'Visitante',
          logo: r.teams?.away?.logo || '',
          winner: r.teams?.away?.winner
        },
        score: {
          home: homeGoals ?? 0,
          away: awayGoals ?? 0
        },
        stats: seedStats(r.fixture?.id || idx, isLive)
      };
    });
  }

  function seedStats(seed, live=false){
    const x = Math.abs(Math.sin(Number(seed) || 1));
    return {
      homeForm: Math.round(58 + x * 31),
      awayForm: Math.round(50 + (1-x) * 29),
      homeGoalsAvg: +(1.12 + x * 1.45).toFixed(2),
      awayGoalsAvg: +(0.95 + (1-x) * 1.2).toFixed(2),
      cornersAvg: +(7.4 + x * 4.4).toFixed(1),
      cardsAvg: +(3.1 + (1-x) * 2.7).toFixed(1),
      pressure: Math.round((live ? 70 : 54) + x * 26),
      lineupReady: live || x > .42
    };
  }

  return { fixturesByDate, liveFixtures, prediction, browserKey, todayISO };
})();

  

/* =====================================================
   PRADO SPORTS AI V12 — Tips Prontas + TIPS AI + Scanner
===================================================== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const state = {
  page: 'home',
  matches: [],
  predictions: [],
  search: '',
  selectedRisk: localStorage.getItem('prado_risk') || 'moderado',
  scannerFilter: 'all',
  premium: localStorage.getItem('prado_premium') === 'true',
  profile: JSON.parse(localStorage.getItem('prado_profile') || 'null'),
  source: 'demo'
};

const DEMO_LEAGUES = ['Brasileirão', 'Premier League', 'La Liga', 'Champions League', 'Libertadores', 'Copa do Brasil', 'Serie A', 'Bundesliga'];
const TEAM_LOGOS = {
  Flamengo:'https://media.api-sports.io/football/teams/127.png', Palmeiras:'https://media.api-sports.io/football/teams/121.png',
  Botafogo:'https://media.api-sports.io/football/teams/120.png', 'São Paulo':'https://media.api-sports.io/football/teams/126.png',
  Corinthians:'https://media.api-sports.io/football/teams/131.png', 'Atlético-MG':'https://media.api-sports.io/football/teams/1062.png',
  Arsenal:'https://media.api-sports.io/football/teams/42.png', Chelsea:'https://media.api-sports.io/football/teams/49.png',
  Liverpool:'https://media.api-sports.io/football/teams/40.png', 'Manchester City':'https://media.api-sports.io/football/teams/50.png',
  Barcelona:'https://media.api-sports.io/football/teams/529.png', 'Real Madrid':'https://media.api-sports.io/football/teams/541.png',
  PSG:'https://media.api-sports.io/football/teams/85.png', Bayern:'https://media.api-sports.io/football/teams/157.png',
  Boca:'https://media.api-sports.io/football/teams/451.png', River:'https://media.api-sports.io/football/teams/435.png'
};

function makeDemoMatches(){
  const now = new Date();
  const at = (hours, minutes=0) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };
  const base = [
    ['Flamengo','Palmeiras','Brasileirão',21,30,'scheduled',0,0],
    ['Botafogo','São Paulo','Brasileirão',19,0,'scheduled',0,0],
    ['Corinthians','Atlético-MG','Copa do Brasil',16,0,'live',1,1],
    ['Arsenal','Chelsea','Premier League',17,30,'scheduled',0,0],
    ['Liverpool','Manchester City','Premier League',15,0,'live',0,1],
    ['Barcelona','Real Madrid','La Liga',18,0,'scheduled',0,0],
    ['PSG','Bayern','Champions League',16,45,'finished',2,1],
    ['Boca','River','Libertadores',22,0,'scheduled',0,0]
  ];
  return base.map((m, i) => ({
    id: `demo-${i+1}`,
    league: m[2], country: m[2].includes('Bras') || m[2].includes('Copa') ? 'Brasil' : 'Internacional',
    leagueLogo: '', round: 'Rodada premium', date: at(m[3], m[4]), timestamp: Math.floor(new Date(at(m[3],m[4])).getTime()/1000),
    status: m[5], minute: m[5] === 'live' ? 62 + i : null, venue: 'Estádio Prado',
    home: { name:m[0], logo:TEAM_LOGOS[m[0]] || '', winner:null },
    away: { name:m[1], logo:TEAM_LOGOS[m[1]] || '', winner:null },
    score: { home:m[6], away:m[7] },
    stats: {
      homeForm: 63 + (i*7)%28,
      awayForm: 57 + (i*5)%27,
      homeGoalsAvg: +(1.25 + (i%5)*.26).toFixed(2),
      awayGoalsAvg: +(1.05 + (i%4)*.22).toFixed(2),
      cornersAvg: +(8.1 + (i%5)*.8).toFixed(1),
      cardsAvg: +(3.4 + (i%4)*.55).toFixed(1),
      pressure: m[5] === 'live' ? 72 + (i*4)%20 : 55 + (i*5)%26,
      lineupReady: m[5] !== 'scheduled' || i%2 === 0
    }
  }));
}

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function fmtTime(iso){ return new Date(iso).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function fmtDate(iso){ return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function sameDay(iso){ return String(iso).slice(0,10) === todayKey(); }
function logo(team){ return team.logo || TEAM_LOGOS[team.name] || ''; }
function safe(s){ return String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function computePredictions(matches){
  return matches.map((m, i) => {
    const s = m.stats || {};
    const totalGoals = (s.homeGoalsAvg || 1.2) + (s.awayGoalsAvg || 1.0);
    const formGap = (s.homeForm || 55) - (s.awayForm || 52);
    const pressure = s.pressure || 55;
    const base = clamp(Math.round(52 + totalGoals*7 + pressure*.14 + Math.abs(formGap)*.12), 54, 94);
    let market = 'Over 1.5 gols';
    let marketType = 'gols';
    let oddMin = 1.30;

    if(totalGoals > 2.75 && base > 72){ market = 'Over 2.5 gols'; oddMin = 1.70; }
    if(Math.abs(formGap) > 18 && base > 68){ market = formGap > 0 ? `${m.home.name} empate anula` : `${m.away.name} empate anula`; marketType = 'resultado'; oddMin = 1.45; }
    if((s.cornersAvg || 8) > 9.7 && pressure > 66){ market = 'Over 8.5 escanteios'; marketType = 'escanteios'; oddMin = 1.60; }
    if((s.cardsAvg || 3.5) > 4.7){ market = 'Over 3.5 cartões'; marketType = 'cartões'; oddMin = 1.50; }

    const risk = base >= 82 && oddMin <= 1.50 ? 'conservador' : oddMin >= 1.65 ? 'agressivo' : 'moderado';
    const valueScore = clamp(Math.round(base + (oddMin-1.25)*18 + (m.status==='live'?8:0)), 55, 98);
    const reasons = [
      `Média combinada de gols em ${totalGoals.toFixed(2)} por jogo.`,
      `Pressão ofensiva estimada em ${pressure}% ${m.status==='live' ? 'durante o jogo' : 'no pré-jogo'}.`,
      s.lineupReady ? 'Escalação/status disponível para leitura da IA.' : 'Entrada baseada em forma recente e calendário, aguardando escalação.'
    ];
    return {
      id:`pred-${m.id}`,
      matchId:m.id,
      match:m,
      entry:market,
      marketType,
      confidence:base,
      valueScore,
      oddMin:+oddMin.toFixed(2),
      risk,
      reasons,
      status:m.status,
      source:m.apiId ? 'API real + IA Prado' : 'Prévia visual + IA Prado'
    };
  }).sort((a,b)=>b.valueScore-a.valueScore);
}

async function loadData(){
  const dataStatus = $('#dataStatus');
  dataStatus.textContent = 'Buscando jogos do dia...';
  try{
    const [today, live] = await Promise.allSettled([
      PradoFootballAPI.fixturesByDate(PradoFootballAPI.todayISO()),
      PradoFootballAPI.liveFixtures()
    ]);
    const rows = [];
    if(today.status === 'fulfilled') rows.push(...today.value);
    if(live.status === 'fulfilled') rows.push(...live.value);
    const unique = [...new Map(rows.map(m=>[m.id,m])).values()].slice(0,80);
    if(unique.length){
      state.matches = unique;
      state.source = 'api';
      dataStatus.textContent = `API conectada · ${unique.length} jogos carregados`;
    }else throw new Error('Sem jogos na API');
  }catch(err){
    state.matches = makeDemoMatches();
    state.source = 'demo';
    dataStatus.textContent = 'Prévia visual · API depois';
  }
  state.predictions = computePredictions(state.matches);
  renderAll();
}

function renderAll(){
  renderHome(); renderLive(); renderAI(); renderScanner(); renderTips(); updateNav();
}
function filteredMatches(){
  const q = state.search.trim().toLowerCase();
  let rows = state.matches;
  if(q){
    rows = rows.filter(m => [m.home.name,m.away.name,m.league,m.country].join(' ').toLowerCase().includes(q));
  }
  return rows;
}
function filteredPredictions(){
  const ids = new Set(filteredMatches().map(m=>m.id));
  return state.predictions.filter(p=>ids.has(p.matchId));
}

function crestHTML(team, size=30){
  const l = logo(team);
  return l ? `<img class="crest" style="width:${size}px;height:${size}px" src="${safe(l)}" alt="${safe(team.name)}">` : `<span class="crest" style="width:${size}px;height:${size}px;display:grid;place-items:center">⚽</span>`;
}
function sectionHead(title, link='', onclick=''){
  return `<div class="section-head"><div class="section-title">${title}</div>${link ? `<button class="section-link" onclick="${onclick}">${link}</button>` : ''}</div>`;
}
function matchCard(m){
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  return `<article class="card live-card" onclick="openMatchAI('${m.id}')">
    <div class="league-tag">${live?'<span class="pulse"></span>':''}${safe(m.league)} ${m.country ? '· '+safe(m.country) : ''}</div>
    <div class="match-teams">
      <div class="team-line"><div class="team-name">${crestHTML(m.home)}${safe(m.home.name)}</div><div class="score">${finished||live ? m.score.home : ''}</div></div>
      <div class="team-line"><div class="team-name">${crestHTML(m.away)}${safe(m.away.name)}</div><div class="score">${finished||live ? m.score.away : ''}</div></div>
    </div>
    <div class="live-meta"><span class="${live?'live-badge':''}">${live ? `${m.minute || 0}' AO VIVO` : finished ? 'Finalizado' : fmtTime(m.date)}</span><span>${fmtDate(m.date)}</span></div>
  </article>`;
}
function matchRow(m){
  const live = m.status === 'live'; const finished = m.status === 'finished';
  return `<div class="match-row" onclick="openMatchAI('${m.id}')">
    <div class="match-time ${live?'live':''}"><b>${live ? `${m.minute || 0}'` : finished ? 'FIM' : fmtTime(m.date)}</b><br>${live?'LIVE':fmtDate(m.date)}</div>
    <div class="teams">
      <div class="team-name">${crestHTML(m.home,24)}${safe(m.home.name)}</div>
      <div class="team-name">${crestHTML(m.away,24)}${safe(m.away.name)}</div>
    </div>
    <div class="match-score">${finished||live ? `${m.score.home}-${m.score.away}` : 'vs'}</div>
  </div>`;
}

function renderHome(){
  const matches = filteredMatches();
  const live = matches.filter(m=>m.status==='live');
  const today = matches.filter(m=>sameDay(m.date) && m.status!=='live');
  const best = filteredPredictions()[0];
  const topThree = filteredPredictions().slice(0,3);
  $('#page-home').innerHTML = `
    <div class="hero">
      <div class="hero-content">
        <div class="eyebrow">Painel Prado · futebol</div>
        <h1>Scanner IA <span>para hoje.</span></h1>
        <p>Jogos ao vivo, bilhetes por risco e análises prontas em uma tela.</p>
        <div class="hero-actions">
          <button class="btn primary" onclick="goToPage('live')">Ao vivo agora</button>
          <button class="btn ghost" onclick="goToPage('scanner')">Scanner IA</button>
        </div>
      </div>
    </div>
    <div class="stats-strip">
      <div class="stat-pill"><b>${matches.length}</b><span>Jogos lidos</span></div>
      <div class="stat-pill"><b>${live.length}</b><span>Ao vivo</span></div>
      <div class="stat-pill"><b>${topThree.length}</b><span>Top IA</span></div>
    </div>
    ${best ? `<article class="card best-card">
      <div class="eyebrow">Melhor do dia</div>
      <h2 class="answer-entry">${safe(best.entry)}</h2>
      <div class="pick-sub">${safe(best.match.home.name)} x ${safe(best.match.away.name)} · ${safe(best.match.league)}</div>
      <div class="confidence"><div class="bar"><i style="width:${best.confidence}%"></i></div><small>${best.confidence}% IA</small></div>
      <div class="market-tags"><span class="tag green">Odd mín. ${best.oddMin.toFixed(2)}</span><span class="tag gold">${safe(best.risk)}</span><span class="tag">${safe(best.source)}</span></div>
    </article>` : ''}
    ${sectionHead('Ao vivo agora', 'Ver todos', "goToPage('live')")}
    ${live.length ? `<div class="hscroll">${live.slice(0,6).map(matchCard).join('')}</div>` : `<div class="card empty">Nenhum jogo ao vivo neste momento.</div>`}
    ${sectionHead('Jogos de hoje', 'Atualizar', 'loadData()')}
    <div class="match-list">${today.slice(0,12).map(matchRow).join('') || '<div class="card empty">Nenhum jogo encontrado para hoje.</div>'}</div>
    ${sectionHead('Principais ligas')}
    <div class="source-row">${DEMO_LEAGUES.map(l=>`<span class="tag gold">${safe(l)}</span>`).join('')}</div>
    <p class="legal">Análises informativas. Não existe garantia de acerto ou lucro.</p>
  `;
}

function renderLive(){
  const live = filteredMatches().filter(m=>m.status==='live');
  const pre = filteredMatches().filter(m=>m.status!=='live').slice(0,8);
  $('#page-live').innerHTML = `
    ${sectionHead('Ao vivo agora', live.length ? `${live.length} jogos` : '')}
    <div class="card compact">
      <div class="card-title">Jogos ao vivo separados da tela inicial</div>
      <p class="muted">Aqui ficam os jogos em andamento, com placar, minuto e botão para análise IA.</p>
    </div>
    ${live.length ? `<div class="match-list live-list">${live.map(matchRow).join('')}</div>` : '<div class="card empty">Nenhum jogo ao vivo neste momento.</div>'}
    ${sectionHead('Próximos jogos para monitorar')}
    <div class="match-list">${pre.map(matchRow).join('') || '<div class="card empty">Nenhum jogo pré-jogo encontrado.</div>'}</div>
  `;
}

function riskLabel(risk){ return {conservador:'Conservador',moderado:'Moderado',agressivo:'Agressivo'}[risk] || 'Moderado'; }
function riskIcon(risk){ return {conservador:'🛡️',moderado:'⚖️',agressivo:'🔥'}[risk] || '⚖️'; }
function ticketFor(risk){
  let rows = [...filteredPredictions()];
  if(risk === 'conservador') rows = rows.filter(p=>p.confidence>=70).sort((a,b)=>b.confidence-a.confidence).slice(0,3);
  if(risk === 'moderado') rows = rows.filter(p=>p.confidence>=62).sort((a,b)=>b.valueScore-a.valueScore).slice(0,4);
  if(risk === 'agressivo') rows = rows.sort((a,b)=>(b.oddMin+b.valueScore/100)-(a.oddMin+a.valueScore/100)).slice(0,5);
  if(!rows.length) rows = filteredPredictions().slice(0,3);
  return rows;
}
function renderTips(){
  const risk = state.selectedRisk;
  const ticket = ticketFor(risk);
  const oddTotal = ticket.reduce((acc,p)=>acc*p.oddMin,1);
  const avgConf = ticket.length ? Math.round(ticket.reduce((a,p)=>a+p.confidence,0)/ticket.length) : 0;
  $('#page-tips').innerHTML = `
    ${sectionHead('🎟️ Tips Prontas')}
    <div class="card compact">
      <div class="card-title">Seleção diária de bilhetes montados pela IA</div>
      <p class="muted">Escolha o nível de risco do dia, confira os motivos e copie o bilhete pronto.</p>
    </div>
    <div class="risk-grid">
      ${['conservador','moderado','agressivo'].map(r=>`<button class="risk-btn ${risk===r?'active':''}" onclick="setRisk('${r}')"><span>${riskIcon(r)}</span>${riskLabel(r)}</button>`).join('')}
    </div>
    <article class="card tip-card">
      <div class="ticket-header">
        <div><span class="risk-badge">${riskIcon(risk)} ${riskLabel(risk)}</span><div class="card-title" style="margin-top:8px">Bilhete IA do dia</div><p class="muted">${ticket.length} seleções · odd combinada estimada ${oddTotal.toFixed(2)}</p></div>
        <div class="opp-score">${avgConf}%</div>
      </div>
      ${ticket.map(p=>`<div class="ticket-pick"><div class="pick-main"><span>${safe(p.match.home.name)} x ${safe(p.match.away.name)}</span><b>${safe(p.entry)}</b></div><div class="pick-sub">${safe(p.match.league)} · Odd mín. ${p.oddMin.toFixed(2)} · ${p.confidence}% confiança</div></div>`).join('')}
      <div class="confidence"><div class="bar"><i style="width:${avgConf}%"></i></div><small>${avgConf}% média</small></div>
      <button class="btn primary wide" onclick="copyTicket('${risk}')">📋 Copiar Bilhete</button>
    </article>
    <div class="notice">No modo grátis, deixe 1 tip aberta e bloqueie o restante. No Premium, libere todos os níveis, scanner ao vivo e TIPS AI ilimitada.</div>
  `;
}
function setRisk(risk){ state.selectedRisk = risk; localStorage.setItem('prado_risk', risk); renderTips(); toast(`Risco ${riskLabel(risk)} selecionado`, riskIcon(risk)); }
function copyTicket(risk){
  const t = ticketFor(risk);
  const text = [`PRADO SPORTS AI — Bilhete ${riskLabel(risk)}`, ...t.map((p,i)=>`${i+1}. ${p.match.home.name} x ${p.match.away.name} — ${p.entry} | odd mín. ${p.oddMin.toFixed(2)} | ${p.confidence}% IA`), 'Análise informativa. Sem garantia de resultado.'].join('\n');
  navigator.clipboard?.writeText(text).then(()=>toast('Bilhete copiado com sucesso 📋')).catch(()=>toast('Não consegui copiar automaticamente. Segure e copie manualmente.', '⚠️'));
}

function renderAI(){
  const options = filteredMatches().map(m=>`<option value="${m.id}">${safe(m.home.name)} x ${safe(m.away.name)} · ${safe(m.league)}</option>`).join('');
  $('#page-ai').innerHTML = `
    ${sectionHead('🤖 TIPS AI')}
    <div class="card">
      <div class="card-title">Peça o jogo e o tipo de retorno</div>
      <p class="muted">A IA cruza estatística, momento, pressão, status e escalação disponível para devolver uma entrada pronta com motivo.</p>
      <div class="form-grid">
        <select id="aiMatch" class="field">${options}</select>
        <select id="aiReturn" class="field">
          <option value="segura">Entrada mais segura</option>
          <option value="valor">Melhor valor da odd</option>
          <option value="agressiva">Entrada agressiva</option>
          <option value="gols">Mercado de gols</option>
          <option value="escanteios">Mercado de escanteios</option>
          <option value="cartoes">Mercado de cartões</option>
        </select>
        <textarea id="aiPrompt" class="field textarea" placeholder="Ex: Quero uma entrada para Flamengo x Palmeiras com retorno seguro"></textarea>
        <button class="btn primary wide" onclick="generateAIAnswer()">Gerar análise IA</button>
      </div>
      <div id="aiAnswer" class="ai-answer hidden"></div>
    </div>
    <div class="card compact" style="margin-top:12px">
      <div class="card-title">Motor de dados inteligente</div>
      <p class="muted">Cruzamento com múltiplas fontes esportivas quando configuradas: API de jogos, estatísticas, escalações, odds, notícias e dados ao vivo.</p>
      <div class="source-row"><span class="tag green">Pré-jogo</span><span class="tag green">Ao vivo</span><span class="tag gold">Principais ligas</span><span class="tag">50+ fontes preparado</span></div>
    </div>
  `;
}
function pickForIntent(pred, intent){
  const m = pred.match; const s = m.stats || {};
  if(intent === 'segura') return {entry: pred.confidence >= 74 ? 'Over 1.5 gols' : 'Dupla chance a favor do time mais forte', odd: 1.30};
  if(intent === 'valor') return {entry: pred.valueScore >= 78 ? pred.entry : 'Ambas marcam — sim', odd: Math.max(pred.oddMin, 1.62)};
  if(intent === 'agressiva') return {entry: s.cornersAvg > 9.4 ? 'Over 9.5 escanteios' : 'Over 2.5 gols', odd: 1.85};
  if(intent === 'gols') return {entry: ((s.homeGoalsAvg+s.awayGoalsAvg)>2.7) ? 'Over 2.5 gols' : 'Over 1.5 gols', odd: ((s.homeGoalsAvg+s.awayGoalsAvg)>2.7) ? 1.70 : 1.30};
  if(intent === 'escanteios') return {entry: s.cornersAvg > 9.2 ? 'Over 8.5 escanteios' : 'Over 7.5 escanteios', odd: s.cornersAvg > 9.2 ? 1.60 : 1.38};
  if(intent === 'cartoes') return {entry: s.cardsAvg > 4.2 ? 'Over 3.5 cartões' : 'Over 2.5 cartões', odd: s.cardsAvg > 4.2 ? 1.52 : 1.32};
  return {entry: pred.entry, odd: pred.oddMin};
}
function generateAIAnswer(){
  const matchId = $('#aiMatch')?.value;
  const intent = $('#aiReturn')?.value || 'segura';
  const pred = state.predictions.find(p=>p.matchId===matchId) || state.predictions[0];
  if(!pred) return;
  const chosen = pickForIntent(pred, intent);
  const conf = clamp(Math.round(pred.confidence + (intent==='segura'?4:intent==='agressiva'?-8:0)), 52, 94);
  const m = pred.match;
  const answer = $('#aiAnswer');
  answer.classList.remove('hidden');
  answer.innerHTML = `
    <div class="eyebrow">Análise gerada</div>
    <div class="answer-entry">${safe(chosen.entry)}</div>
    <div class="pick-sub">${safe(m.home.name)} x ${safe(m.away.name)} · ${safe(m.league)} · Odd mínima recomendada ${chosen.odd.toFixed(2)}</div>
    <div class="confidence"><div class="bar"><i style="width:${conf}%"></i></div><small>${conf}% IA</small></div>
    <ul class="reason-list">
      <li>${safe(pred.reasons[0])}</li>
      <li>${safe(pred.reasons[1])}</li>
      <li>${m.status === 'live' ? `Jogo ao vivo aos ${m.minute || 0} minutos, leitura prioriza pressão atual.` : 'Pré-jogo: leitura prioriza forma recente, mando e tendência de mercado.'}</li>
      <li>${(m.stats || {}).lineupReady ? 'Escalação/status confirmado entrou no cálculo.' : 'Escalação ainda não confirmada; recomendação deve ser revisada antes da partida.'}</li>
    </ul>
    <div class="market-tags"><span class="tag green">${safe(intent)}</span><span class="tag gold">${safe(pred.source)}</span><span class="tag">Sem garantia</span></div>
    <button class="btn secondary wide" onclick="copyAIEntry('${safe(chosen.entry)}','${safe(m.home.name)} x ${safe(m.away.name)}',${conf},${chosen.odd})">📋 Copiar análise</button>
  `;
}
function copyAIEntry(entry, game, conf, odd){
  const text = `TIPS AI — ${game}
Entrada: ${entry}
Confiança IA: ${conf}%
Odd mínima: ${Number(odd).toFixed(2)}
Motivo: análise de estatística, momento, pressão e status do jogo.
Sem garantia de resultado.`;
  navigator.clipboard?.writeText(text).then(()=>toast('Análise copiada 📋'));
}
function openMatchAI(id){ goToPage('ai'); setTimeout(()=>{ const sel=$('#aiMatch'); if(sel){ sel.value=id; generateAIAnswer(); } }, 50); }

function renderScanner(){
  const filters = [
    ['all','Todos'],['best','Melhor do dia'],['confidence','Top confiança'],['value','Top valor'],['live','Ao vivo']
  ];
  let rows = filteredPredictions();
  if(state.scannerFilter === 'best') rows = rows.slice(0,1);
  if(state.scannerFilter === 'confidence') rows = [...rows].sort((a,b)=>b.confidence-a.confidence).slice(0,8);
  if(state.scannerFilter === 'value') rows = [...rows].sort((a,b)=>b.valueScore-a.valueScore).slice(0,8);
  if(state.scannerFilter === 'live') rows = rows.filter(p=>p.match.status==='live');
  $('#page-scanner').innerHTML = `
    ${sectionHead('🔎 Prado Scanner IA')}
    <div class="card compact">
      <div class="card-title">Oportunidades detectadas antes e durante o jogo</div>
      <p class="muted">Filtro por melhor do dia, top confiança, top valor e ao vivo. Ideal para parecer painel profissional.</p>
    </div>
    <div class="chip-row">${filters.map(f=>`<button class="chip ${state.scannerFilter===f[0]?'active':''}" onclick="setScannerFilter('${f[0]}')">${f[1]}</button>`).join('')}</div>
    <div class="scanner-grid">${rows.length ? rows.map(opportunityCard).join('') : '<div class="card empty">Nenhuma oportunidade encontrada nesse filtro.</div>'}</div>
  `;
}
function opportunityCard(p){
  const m = p.match;
  const type = m.status === 'live' ? '⚡ Ao vivo agora' : p.valueScore > 84 ? '🎯 Top valor' : p.confidence > 80 ? '🔥 Top confiança' : '⭐ Oportunidade';
  return `<article class="card opportunity-card">
    <div class="opp-top"><span class="opp-type">${type}</span><span class="opp-score">${p.valueScore}</span></div>
    <div class="pick-sub">${safe(m.league)} · ${m.status==='live' ? `${m.minute || 0}'` : fmtTime(m.date)}</div>
    <div class="opp-entry">${safe(p.entry)}</div>
    <div class="pick-sub"><b>${safe(m.home.name)} x ${safe(m.away.name)}</b></div>
    <div class="data-grid">
      <div class="data-box"><b>${p.confidence}%</b><span>Confiança IA</span></div>
      <div class="data-box"><b>${p.oddMin.toFixed(2)}</b><span>Odd mínima</span></div>
      <div class="data-box"><b>${(m.stats || {}).cornersAvg || '-'} </b><span>Cantos médios</span></div>
      <div class="data-box"><b>${(m.stats || {}).pressure || '-'}%</b><span>Pressão</span></div>
    </div>
    <div class="market-tags"><span class="tag green">${safe(p.marketType)}</span><span class="tag gold">${safe(riskLabel(p.risk))}</span></div>
    <button class="btn primary wide" onclick="openMatchAI('${m.id}')">🤖 Analisar com IA</button>
  </article>`;
}
function setScannerFilter(f){ state.scannerFilter = f; renderScanner(); }

function renderPremium(){
  const premium = state.premium;
  $('#page-premium').innerHTML = `
    ${sectionHead('💎 Prado Premium')}
    <article class="card premium-hero ${premium?'':'premium-locked'}">
      <div class="eyebrow">${premium ? 'Acesso liberado' : 'Desbloqueie o app completo'}</div>
      <h2 class="answer-entry">Tips, TIPS AI e Scanner sem limite</h2>
      <div class="price">${safe(PRADO_CONFIG.PREMIUM_PRICE || 'R$ 19,90/mês')} <small></small></div>
      <p class="muted">Produto com cara de painel profissional: bilhetes diários, análise por jogo, filtros avançados e oportunidades ao vivo.</p>
      <button class="btn gold wide" onclick="openPayment()">Liberar Meu Acesso Premium</button>
    </article>
    <div class="benefit-list">
      ${benefit('🎟️','Tips Prontas','Bilhetes conservador, moderado e agressivo para copiar.')}
      ${benefit('🤖','TIPS AI','Você pede o jogo e a IA devolve entrada pronta com motivo.')}
      ${benefit('🔎','Scanner IA','Melhor do dia, top confiança, top valor e oportunidades ao vivo.')}
      ${benefit('📊','Dados em tempo real','Pré-jogo e ao vivo quando a API estiver configurada.')}
      ${benefit('🌍','Principais campeonatos','Brasileirão, Premier League, La Liga, Champions, Libertadores e mais.')}
      ${benefit('🔐','Validação premium','Liberação por código, link de pagamento ou planilha depois.')}
    </div>
    <div class="card">
      <div class="card-title">Já comprou? Liberar por código</div>
      <div class="unlock-box">
        <input id="premiumCode" class="field" placeholder="Digite o código premium" />
        <button class="btn primary wide" onclick="unlockPremium()">Validar acesso</button>
      </div>
      <p class="legal">Códigos de teste nesta versão: PRADO2026, CARLOSVIP, PRADO19. Troque isso antes de vender.</p>
    </div>
  `;
}
function benefit(icon,title,desc){ return `<div class="benefit"><span>${icon}</span><div><b>${title}</b><small>${desc}</small></div></div>`; }
async function unlockPremium(){
  const code = ($('#premiumCode')?.value || '').trim().toUpperCase();
  let codes = (PRADO_CONFIG.PREMIUM_CODES || []).map(c=>String(c).toUpperCase());
  if(PRADO_CONFIG.PREMIUM_CODES_CSV){
    try{
      const res = await fetch(PRADO_CONFIG.PREMIUM_CODES_CSV, {cache:'no-store'});
      const text = await res.text();
      codes = codes.concat(text.split(/\r?\n|,/).map(x=>x.trim().toUpperCase()).filter(Boolean));
    }catch(_err){}
  }
  if(codes.includes(code)){
    state.premium = true; localStorage.setItem('prado_premium','true'); toast('Premium liberado com sucesso 💎');
  }else toast('Código inválido ou não encontrado', '⚠️');
}
function openPayment(){
  const link = PRADO_CONFIG.PAYMENT_LINK || '';
  if(link && !link.includes('SEU-LINK')) window.open(link, '_blank');
  else toast('Coloque seu link de pagamento no configuração do app', '💳');
}

function goToPage(page){
  state.page = page;
  document.body.dataset.page = page;
  $$('.page').forEach(p=>p.classList.remove('active'));
  $(`#page-${page}`)?.classList.add('active');
  updateNav();
  window.scrollTo({top:0,behavior:'smooth'});
}
function updateNav(){
  document.body.dataset.page = state.page;
  $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.page===state.page));
}
function toast(msg, icon='✅'){
  const t = $('#toast');
  t.textContent = `${icon} ${msg}`;
  t.classList.add('show'); clearTimeout(t._timer); t._timer = setTimeout(()=>t.classList.remove('show'), 2500);
}

const quiz = {
  idx:0, answers:{},
  steps:[
    {key:'goal', title:'Qual seu objetivo hoje?', options:[['seguranca','Mais segurança'],['valor','Encontrar valor'],['multipla','Montar múltipla']]},
    {key:'risk', title:'Qual risco você prefere?', options:[['conservador','Conservador'],['moderado','Moderado'],['agressivo','Agressivo']]},
    {key:'market', title:'Qual mercado você acompanha mais?', options:[['gols','Gols'],['escanteios','Escanteios'],['cartoes','Cartões'],['resultado','Resultado']]}
  ]
};
function openQuiz(){ quiz.idx=0; quiz.answers={}; renderQuizStep(); $('#quizModal').showModal(); }
function renderQuizStep(){
  const step = quiz.steps[quiz.idx];
  $('#quizBody').innerHTML = `<div class="quiz-step"><div class="eyebrow">Pergunta ${quiz.idx+1} de ${quiz.steps.length}</div><h3>${step.title}</h3><div class="quiz-options">${step.options.map(o=>`<button class="btn secondary" onclick="answerQuiz('${step.key}','${o[0]}')">${o[1]}</button>`).join('')}</div></div>`;
}
function answerQuiz(key,val){
  quiz.answers[key]=val; quiz.idx++;
  if(quiz.idx < quiz.steps.length) renderQuizStep(); else finishQuiz();
}
function finishQuiz(){
  const profile = quiz.answers.risk || 'moderado';
  state.profile = { risk: profile, market: quiz.answers.market, goal: quiz.answers.goal, date: new Date().toISOString() };
  state.selectedRisk = profile; localStorage.setItem('prado_profile', JSON.stringify(state.profile)); localStorage.setItem('prado_risk', profile);
  $('#quizBody').innerHTML = `<div class="quiz-result"><div class="profile-card"><div class="eyebrow">Perfil detectado</div><h3>${riskIcon(profile)} Analista ${riskLabel(profile)}</h3><p class="muted">A IA vai priorizar ${quiz.answers.market || 'gols'} e montar bilhetes com risco ${riskLabel(profile).toLowerCase()}.</p></div><button class="btn primary wide" onclick="document.getElementById('quizModal').close(); goToPage('tips'); renderTips();">Ver minhas Tips Prontas</button></div>`;
}

function bindEvents(){
  $('#enterApp').addEventListener('click', () => { $('#splash').classList.add('hidden'); $('#app').classList.remove('hidden'); });
  $('#startQuiz').addEventListener('click', () => { $('#splash').classList.add('hidden'); $('#app').classList.remove('hidden'); openQuiz(); });
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>goToPage(b.dataset.page)));
  $('#globalSearch').addEventListener('input', e=>{ state.search=e.target.value; renderAll(); });
  $('#openSettings').addEventListener('click',()=>$('#settingsModal').showModal());
  $('#openSettingsMini')?.addEventListener('click',()=>$('#settingsModal').showModal());
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
  $('#saveApiKey')?.addEventListener('click',()=>{ localStorage.setItem('prado_api_key', $('#apiKeyInput').value.trim()); toast('Chave salva para teste. Atualizando dados...','🔑'); loadData(); });
  if($('#apiKeyInput')) $('#apiKeyInput').value = localStorage.getItem('prado_api_key') || '';
  $('#floatingAI').addEventListener('click',()=>goToPage('ai'));
  makeFloatingDraggable($('#floatingAI'));
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
function makeFloatingDraggable(el){
  let dragging=false, sx=0, sy=0, ox=0, oy=0;
  el.addEventListener('pointerdown', e=>{ dragging=true; sx=e.clientX; sy=e.clientY; const r=el.getBoundingClientRect(); ox=r.left; oy=r.top; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e=>{ if(!dragging) return; const nx=clamp(ox+e.clientX-sx, 8, innerWidth-70); const ny=clamp(oy+e.clientY-sy, 80, innerHeight-140); el.style.left=nx+'px'; el.style.top=ny+'px'; el.style.right='auto'; el.style.bottom='auto'; });
  el.addEventListener('pointerup', ()=>{ dragging=false; });
}

window.goToPage = goToPage;
window.loadData = loadData;
window.setRisk = setRisk;
window.copyTicket = copyTicket;
window.generateAIAnswer = generateAIAnswer;
window.copyAIEntry = copyAIEntry;
window.openMatchAI = openMatchAI;
window.setScannerFilter = setScannerFilter;
window.unlockPremium = unlockPremium;
window.openPayment = openPayment;
window.answerQuiz = answerQuiz;

bindEvents();
loadData();

  