import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp, Home as HomeIcon, Calculator, Store, Bell, User,
  Gem, Sun, Moon, Check, Sparkles, LayoutDashboard, ArrowLeftRight,
  Trophy, Tag, BarChart3, Lightbulb, ChevronDown, Lock, Package, Plus, Trash2, Download, Percent, ExternalLink,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ---------- Temas ---------- */
const THEMES = {
  branco: {
    "--bg": "#FFFFFF", "--app": "#F2F4F8", "--card": "#FFFFFF", "--soft": "#F4F6FA",
    "--line": "#E3E8F0", "--tx": "#0F1B2D", "--tx2": "#3E4C63", "--tx3": "#66738A",
    "--pur": "#0B2A5B", "--purBg": "#E6EDF8",
    "--grn": "#1E9E5A", "--grnBg": "#E7F6EE", "--grnLn": "#CDEBD8",
    "--amb": "#56657E", "--ambBg": "#EDF0F5", "--ambLn": "#D8DEE8",
    "--org": "#B98A00", "--orgBg": "#FBF4DC", "--orgLn": "#EFE0A6",
    "--red": "#D6453A", "--blu": "#1F6FD1",
  },
  preto: {
    "--bg": "#0C0D11", "--app": "#000000", "--card": "#16171D", "--soft": "#1B1C23",
    "--line": "#282A33", "--tx": "#F1F2F5", "--tx2": "#A0A2AC", "--tx3": "#6C6E78",
    "--pur": "#5E8FE8", "--purBg": "#172440",
    "--grn": "#38D26B", "--grnBg": "#14301F", "--grnLn": "#1F4A31",
    "--amb": "#8E9BB2", "--ambBg": "#1C2230", "--ambLn": "#2A3244",
    "--org": "#E2B43C", "--orgBg": "#2E2812", "--orgLn": "#4A3F1F",
    "--red": "#F26D5B", "--blu": "#5AA2ED",
  },
};

/* ---------- Helpers ---------- */
const money = (n) => { const v = !isFinite(n) || n === 0 ? 0 : n; return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
const pnum = (s) => { if (typeof s === "number") return s; const v = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isNaN(v) ? 0 : v; };
const ini = (n) => (n.trim()[0] || "?").toUpperCase();
const txtOn = (hex) => { const h = hex.replace("#", ""); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1B1B23" : "#FFFFFF"; };
const mcor = (m, meta = 20) => { const d = m - meta; return d >= 10 ? "var(--blu)" : d >= 0 ? "var(--grn)" : d > -10 ? "var(--org)" : "var(--red)"; };

/* ==================== MOTOR DE TAXAS — PAINEL DE MANUTENÇÃO ====================
   Quando uma plataforma mudar a regra, atualize AQUI (só esta tabela). O motor
   lê isto sozinho — não precisa mexer no cálculo. Números 2026; conferir no
   Seller Center de cada canal. Novo canal / nova categoria = nova linha aqui.
   Tipos: "flat" (% único), "faixas" (muda pela faixa de preço), "modalidade"
   (ex.: ML Clássico/Premium). "conf: true" = valor a confirmar. ============= */
const REGRAS = {
  kwai:   { tipo: "flat",   pct: 8,  fixo: 0, conf: true },
  temu:   { tipo: "flat",   pct: 15, fixo: 0, conf: true },
  shein:  { tipo: "flat",   pct: 16, fixo: 0, conf: true },
  // TikTok Shop — vigente desde 15/07/2026 (Seller University): < R$50 = 10% + R$4 · ≥ R$50 = 6% + R$6
  tiktok: { tipo: "faixas", faixas: [ { ate: 49.99, pct: 10, fixo: 4 }, { ate: Infinity, pct: 6, fixo: 6 } ] },
  // Shopee — vigente desde 01/03/2026. CPF com +450 pedidos em 90 dias paga + R$3/item (extraCpf)
  shopee: { tipo: "faixas", extraCpf: 3, metadeAte: 8, faixas: [ { ate: 79.99, pct: 20, fixo: 4.5 }, { ate: 99.99, pct: 14, fixo: 16 }, { ate: 199.99, pct: 14, fixo: 20 }, { ate: Infinity, pct: 14, fixo: 26 } ] },
  // Mercado Livre — Moda/Calçados: Clássico 14% · Premium 19%. Custo fixo por unidade só abaixo de R$ 79 (escada abaixo);
  // abaixo de R$ 12,50 o custo fixo é 50% do preço. A partir de R$ 79: sem custo fixo, mas frete grátis obrigatório.
  ml:     { tipo: "modalidade", modos: { classico: { pct: 14 }, premium: { pct: 19 } }, unidadeAbaixoDe: 79,
            fixoFaixas: [ { ate: 12.49, metade: true }, { ate: 28.99, valor: 6.25 }, { ate: 49.99, valor: 6.5 }, { ate: 78.99, valor: 6.75 } ] },
};
/* Informações de CONSULTA (aba Taxas). Atualizar junto com REGRAS. */
const INFO_TAXAS = {
  shopee: { atualizado: "26/09/2026 (taxa fixa até R$ 79,99 passou a R$ 4,50)", fonte: "https://seller.shopee.com.br/edu/home", notas: [
    "Atenção à virada de R$ 80,00: a taxa pula de 20% + R$ 4,50 para 14% + R$ 16,00. Um produto de R$ 80 paga mais taxa que um de R$ 79,99.",
    "A comissão é cobrada só sobre o valor do produto, não sobre o frete.",
    "Vendedor CPF com mais de 450 pedidos em 90 dias paga + R$ 3,00 por item (marque em Marketplaces).",
    "Produtos de até R$ 8,00: a taxa é metade do preço do produto (o app já calcula). Entre R$ 8 e R$ 12 pode haver redução — confira no Seller Center.",
    "Subsídio Pix (5% de R$ 80 a R$ 499,99 e 8% acima de R$ 500): a Shopee dá o desconto ao cliente, o valor que você recebe não muda.",
  ] },
  tiktok: { atualizado: "15/07/2026", fonte: "https://seller-br.tiktok.com/university/essay?knowledge_id=24428156307201&lang=pt-BR", notas: [
    "A faixa é definida pelo preço DEPOIS do desconto do vendedor (desconto da plataforma não conta).",
    "Vendedores novos que cumprem as missões podem ter 0% de comissão por 60 dias.",
    "Programa de frete grátis mantém 6% de comissão.",
  ] },
  ml: { atualizado: "2026 (Moda e Calçados)", fonte: "https://www.mercadolivre.com.br/landing/custos-de-venda", notas: [
    "A comissão varia por categoria; o app usa a média de calçados. Confira a sua categoria.",
    "Anúncio Premium cobra mais, mas parcela sem juros para o cliente.",
    "Abaixo de R$ 79 há um custo fixo por unidade em escada (R$ 6,25 · R$ 6,50 · R$ 6,75); abaixo de R$ 12,50 é 50% do preço.",
    "A partir de R$ 79 o custo fixo some, mas o frete grátis é obrigatório e boa parte dele é paga por você — informe em Marketplaces (Frete absorvido).",
    "Desde 2026 o custo fixo também pode variar por peso e tamanho: confira no simulador do seu anúncio.",
  ] },
  kwai: { atualizado: "a confirmar", fonte: "", notas: ["Valor estimado. Confirme no painel de vendedor antes de usar."] },
  temu: { atualizado: "a confirmar", fonte: "", notas: ["Valor estimado. Confirme no painel de vendedor antes de usar."] },
  shein: { atualizado: "a confirmar", fonte: "", notas: ["Valor estimado. Confirme no painel de vendedor antes de usar."] },
};

// Motor: dado o canal, o preço e a modalidade, devolve % + taxa fixa + teto da faixa certa
function taxaCanal(key, preco, modo) {
  const r = REGRAS[key];
  if (!r) return { pct: 0, fixo: 0, teto: null };
  if (r.tipo === "flat") return { pct: r.pct, fixo: r.fixo || 0, teto: null };
  if (r.tipo === "faixas") {
    if (r.metadeAte && preco > 0 && preco <= r.metadeAte) return { pct: 50, fixo: 0, teto: null };
    const f = r.faixas.find((x) => preco <= x.ate) || r.faixas[r.faixas.length - 1];
    return { pct: f.pct, fixo: f.fixo || 0, teto: f.teto || null };
  }
  if (r.tipo === "modalidade") {
    const m = r.modos[modo] || r.modos.classico;
    let fixo = 0;
    if (preco < (r.unidadeAbaixoDe || 0)) {
      const ff = (r.fixoFaixas || []).find((x) => preco <= x.ate);
      fixo = ff ? (ff.metade ? preco * 0.5 : ff.valor) : (r.unidadeValor || 0);
    }
    return { pct: m.pct, fixo, teto: null };
  }
  return { pct: 0, fixo: 0, teto: null };
}
// Resumo em texto da regra de um canal (pra mostrar no card, só leitura)
function resumoRegra(key) {
  const r = REGRAS[key];
  if (!r) return "—";
  if (r.tipo === "flat") return `Comissão ${r.pct}%${r.fixo ? ` + R$ ${r.fixo}/item` : ""}${r.conf ? " · a confirmar" : ""}`;
  if (r.tipo === "faixas") return "Comissão por faixa de preço (automática)";
  if (r.tipo === "modalidade") return `Clássico ${r.modos.classico.pct}% · Premium ${r.modos.premium.pct}% · custo fixo abaixo de R$ ${r.unidadeAbaixoDe}`;
  return "—";
}

/* Cálculo de UMA venda num canal — usado no Simulador, Dashboard e na tabela de Produtos */
function calcVenda(S, c, custoN, precoN) {
  const imp = pnum(S.imposto);
  const rg = taxaCanal(c.key, precoN, c.modo);
  let comPlat = precoN * (rg.pct / 100);
  if (rg.teto) comPlat = Math.min(comPlat, rg.teto);
  const comAfi = S.afiliado ? precoN * (pnum(c.afi) / 100) : 0;
  const extra = (REGRAS[c.key] && REGRAS[c.key].extraCpf && c.cpf450) ? REGRAS[c.key].extraCpf : 0;
  const fix = rg.fixo + extra, frete = S.freteOn ? pnum(c.frete) : 0, impv = precoN * (imp / 100);
  const envio = pnum(S.envio), nfe = pnum(S.nfe), ger = S.gestaoOn ? precoN * (pnum(S.gerenc) / 100) : 0;
  const taxas = comPlat + comAfi + fix + frete + impv + envio + nfe + ger;
  const lucro = precoN - custoN - taxas;
  const margem = precoN > 0 ? (lucro / precoN) * 100 : 0;
  return { c, comPlat, comAfi, fix, frete, impv, envio, nfe, ger, taxas, lucro, margem, pct: rg.pct };
}
/* Menor preço que bate a margem meta naquele canal (varre de 1 em 1 centavo, respeita as faixas) */
function precoParaMeta(S, c, custoN, meta) {
  if (custoN <= 0) return 0;
  const inicio = Math.round(custoN * 100) + 1, fim = Math.round(custoN * 100 * 12);
  for (let cent = inicio; cent <= fim; cent++) {
    const p = cent / 100;
    if (calcVenda(S, c, custoN, p).margem >= meta) return p;
  }
  return 0;
}
/* Canais que a pessoa usa (se nenhum marcado, usa todos) */
function canaisAtivos(S) { const a = S.ativos || []; const l = S.canais.filter((c) => a.includes(c.id)); return l.length ? l : S.canais; }

const DEFAULT = {
  tema: "branco", layout: "auto", usuario: "", afiliado: false, freteOn: true, alvo: "20", imposto: "",
  envio: "0,50", nfe: "0,50", gerenc: "", gestaoOn: false, simCanais: [], canalTabela: 5, ativos: [1, 2, 3, 4, 5, 6],
  produtos: [],
  custo: "45,00", preco: "64,90",
  canais: [
    { id: 1, key: "kwai",   nome: "Kwai", cor: "#FF6A2C", logo: "/logos/kwai.png", afi: "0", frete: "0,00" },
    { id: 2, key: "tiktok", nome: "TikTok Shop", cor: "#111318", logo: "/logos/tiktok.png", afi: "3", frete: "0,00" },
    { id: 3, key: "temu",   nome: "Temu", cor: "#FB7701", logo: "/logos/temu.png", afi: "0", frete: "0,00" },
    { id: 4, key: "shein",  nome: "Shein", cor: "#111318", logo: "/logos/shein.png", afi: "0", frete: "0,00" },
    { id: 5, key: "shopee", nome: "Shopee", cor: "#EE4D2D", logo: "/logos/shopee.png", afi: "0", frete: "0,00" },
    { id: 6, key: "ml",     nome: "Mercado Livre", cor: "#F5C518", logo: "/logos/mercadolivre.png", afi: "0", frete: "0,00", modo: "classico" },
  ],
  historico: [],
};

function mergeSaved(saved) {
  const base = { ...DEFAULT, ...saved };
  base.canais = DEFAULT.canais.map((dc) => {
    const sc = (saved.canais || []).find((x) => x.id === dc.id) || {};
    return { ...dc, ...sc, logo: dc.logo, key: dc.key };
  });
  return base;
}

/* ---------- App raiz ---------- */
export default function MarginPro() {
  const [S, setS] = useState(DEFAULT);
  const [tab, setTab] = useState("simulador");
  const [narrow, setNarrow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const on = () => setNarrow(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    try { const raw = localStorage.getItem("marginpro-mvp"); if (raw) setS(mergeSaved(JSON.parse(raw))); } catch (e) {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("marginpro-mvp", JSON.stringify(S)); } catch (e) {} }, [S, loaded]);

  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const setCanal = (id, k, v) => setS((p) => ({ ...p, canais: p.canais.map((c) => (c.id === id ? { ...c, [k]: v } : c)) }));

  const imp = pnum(S.imposto);
  const custoN = pnum(S.custo), precoN = pnum(S.preco);

  const d = useMemo(() => {
    const ativos0 = canaisAtivos(S);
    const sel = (S.simCanais || []).map((id) => ativos0.find((c) => c.id === id)).filter(Boolean);
    const ativos = sel.length ? sel : ativos0;
    const rows = ativos.map((c) => calcVenda(S, c, custoN, precoN));
    const sugeridos = ativos.map((c) => ({ c, preco: precoParaMeta(S, c, custoN, pnum(S.alvo)) }));
    const ranking = [...rows].sort((a, b) => b.lucro - a.lucro);
    const best = ranking[0], worst = ranking[ranking.length - 1];
    const gap = best.lucro - worst.lucro;
    const lucroMedio = rows.reduce((a, b) => a + b.lucro, 0) / rows.length;
    const margemMedia = rows.reduce((a, b) => a + b.margem, 0) / rows.length;
    const doMelhor = sugeridos.find((x) => x.c.id === best.c.id) || sugeridos[0];
    const sugerido = doMelhor ? doMelhor.preco : 0;
    return { rows, ranking, best, worst, gap, lucroMedio, margemMedia, sugerido, sugeridos, canalSug: doMelhor ? doMelhor.c : null, meta: pnum(S.alvo) };
  }, [S, imp, custoN, precoN]);

  const salvar = () => {
    const b = d.ranking[0];
    const item = { t: Date.now(), custo: S.custo, preco: S.preco, canal: b.c.nome, cor: b.c.cor, lucro: b.lucro, margem: b.margem };
    setS((p) => ({ ...p, historico: [...p.historico, item].slice(-30) }));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const isNarrow = S.layout === "pc" ? false : S.layout === "celular" ? true : narrow;
  const vars = THEMES[S.tema] || THEMES.branco;
  const shared = { S, set, setCanal, d, salvar, saved, tab, setTab };

  return (
    <div style={{ ...vars, background: "var(--app)", minHeight: "100vh", color: "var(--tx)",
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif' }}>
      {!loaded ? null : !S.usuario ? <Login onEnter={(nome) => set("usuario", nome)} /> : isNarrow ? <MobileShell {...shared} /> : <DesktopShell {...shared} />}
    </div>
  );
}

/* ---------- Componentes compartilhados ---------- */
function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tx2)" }}>{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: "var(--tx3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function Input({ value, onChange, prefix, suffix, muted, readOnly }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: muted ? "var(--soft)" : "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
      {prefix && <span style={{ color: "var(--tx2)", fontSize: 14, marginRight: 5 }}>{prefix}</span>}
      <input value={value} onChange={(e) => onChange && onChange(e.target.value)} inputMode="decimal" readOnly={readOnly}
        style={{ border: "none", outline: "none", background: "transparent", width: "100%", minWidth: 0, fontSize: 16, fontWeight: 600, color: muted ? "var(--tx2)" : "var(--tx)", fontFamily: "inherit" }} />
      {suffix && <span style={{ color: "var(--tx2)", fontSize: 14 }}>{suffix}</span>}
    </div>
  );
}
function OpToggle({ label, val, set }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 10px 8px 14px" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", background: "var(--card)" }}>
        {[["Não", false], ["Sim", true]].map(([l, v]) => (
          <button key={l} onClick={() => set(v)} style={{ padding: "5px 11px", border: "none", cursor: "pointer", background: val === v ? "var(--pur)" : "transparent", color: val === v ? "#fff" : "var(--tx2)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>
    </div>
  );
}
function Badge({ c, size = 30 }) {
  const [err, setErr] = useState(false);
  if (c.logo && !err) return <img src={c.logo} alt={c.nome} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "contain", borderRadius: 8 }} />;
  return <div style={{ width: size, height: size, borderRadius: 9, background: c.cor, color: txtOn(c.cor), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0 }}>{ini(c.nome)}</div>;
}
function RankCard({ r, i, meta }) {
  const destaque = i === 0;
  const ch = mcor(r.margem, meta);
  return (
    <div style={{ background: "var(--card)", border: destaque ? "1.5px solid var(--pur)" : "1px solid var(--line)", borderRadius: 16, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: destaque ? "var(--pur)" : "var(--tx3)" }}>{destaque ? "Melhor canal" : `${i + 1}º melhor`}</span>
        {destaque && <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: "var(--pur)", padding: "3px 8px", borderRadius: 20 }}>TOP 1</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge c={r.c} size={destaque ? 34 : 28} />
        <div style={{ fontSize: destaque ? 16 : 14, fontWeight: 700, flex: 1 }}>{r.c.nome}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--tx3)" }}>Lucro líquido</div>
          <div style={{ fontSize: destaque ? 22 : 16, fontWeight: destaque ? 800 : 700, color: r.lucro < 0 ? "var(--red)" : "var(--tx)" }}>{money(r.lucro)}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 4, background: "var(--soft)", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, r.margem))}%`, background: ch, borderRadius: 4 }} /></div>
        <span style={{ fontSize: 12, fontWeight: 700, color: ch }}>{r.margem.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function Simulador({ S, d, set, salvar, saved }) {
  const [mais, setMais] = useState(false);
  const top3 = d.ranking.slice(0, 3), resto = d.ranking.slice(3);
  const lado = (S.simCanais || []).length > 1;
  return (
    <div style={{ maxWidth: lado ? 1000 : 560, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Simulador Rápido</div>
      <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 14 }}>Escolha uma ou mais plataformas e insira os dados do produto</div>
      <Field label="Plataforma">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {[{ id: 0, nome: "Todas" }, ...canaisAtivos(S)].map((c) => {
            const sel = S.simCanais || [];
            const on = c.id === 0 ? sel.length === 0 : sel.includes(c.id);
            const click = () => set("simCanais", c.id === 0 ? [] : on ? sel.filter((x) => x !== c.id) : [...sel, c.id]);
            return (
            <button key={c.id} onClick={click}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: c.id ? "7px 12px 7px 8px" : "7px 14px", borderRadius: 22, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                border: on ? "1.5px solid var(--pur)" : "1px solid var(--line)", background: on ? "var(--purBg)" : "var(--card)", color: on ? "var(--pur)" : "var(--tx2)" }}>
              {c.id ? <Badge c={c} size={20} /> : null}{c.nome}
            </button>
          ); })}
        </div>
      </Field>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Custo do Produto (R$)"><Input value={S.custo} onChange={(v) => set("custo", v)} prefix="R$" /></Field>
        <Field label="Preço Desejado (R$)"><Input value={S.preco} onChange={(v) => set("preco", v)} prefix="R$" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sua margem meta"><Input value={S.alvo} onChange={(v) => set("alvo", v)} suffix="%" /></Field>
          <Field label="Preço Sugerido" hint={d.canalSug ? `${pnum(S.alvo)}% na ${d.canalSug.nome}` : `p/ ${pnum(S.alvo)}%`}><Input value={money(d.sugerido).replace("R$", "").trim()} prefix="R$" muted readOnly /></Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <OpToggle label="Afiliado" val={S.afiliado} set={(v) => set("afiliado", v)} />
        <OpToggle label="Frete" val={S.freteOn} set={(v) => set("freteOn", v)} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <OpToggle label="Gestão / agência" val={!!S.gestaoOn} set={(v) => set("gestaoOn", v)} />
      </div>
      {S.gestaoOn && (
        <div style={{ marginTop: 10 }}>
          <Field label="Quanto a gestão cobra?" hint="% sobre cada venda"><Input value={S.gerenc} onChange={(v) => set("gerenc", v)} suffix="%" /></Field>
        </div>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, margin: "24px 0 4px" }}>Resultados da Simulação</div>
      {(d.rows.length > 1 && (S.simCanais || []).length > 0 && d.rows.length <= 3) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0 10px" }}>
          {d.sugeridos.map((x) => <span key={x.c.id} style={{ fontSize: 11.5, color: "var(--tx2)", background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 20, padding: "4px 10px" }}>Sugerido {x.c.nome}: <b>{money(x.preco)}</b></span>)}
        </div>
      )}
      {(d.rows.length === 1 || ((S.simCanais || []).length > 0 && d.rows.length <= 3)) ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(${d.rows.length > 1 ? 300 : 260}px, 1fr))` }}>
          {d.ranking.map((r, i) => (
            <div key={r.c.id} style={{ minWidth: 0 }}>
              {d.rows.length > 1 && <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--pur)" : "var(--tx3)", textTransform: "uppercase", letterSpacing: ".05em", margin: "4px 0 -2px" }}>{i === 0 ? "Melhor lucro" : `${i + 1}º`}</div>}
              <DetalheVenda S={S} r={r} meta={d.meta} />
            </div>
          ))}
        </div>
      ) : (<>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0 12px" }}>
          {d.sugeridos.map((x) => <span key={x.c.id} style={{ fontSize: 11.5, color: "var(--tx2)", background: "var(--soft)", border: "1px solid var(--line)", borderRadius: 20, padding: "4px 10px" }}>Sugerido {x.c.nome}: <b>{money(x.preco)}</b></span>)}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--tx3)", marginBottom: 12 }}>Top {Math.min(3, d.rows.length)} marketplaces</div>
        <div style={{ display: "grid", gap: 12 }}>
          {top3.map((r, i) => <RankCard key={r.c.id} r={r} i={i} meta={d.meta} />)}
        </div>
        {resto.length > 0 && <button onClick={() => setMais((m) => !m)} style={{ width: "100%", marginTop: 12, padding: "10px", background: "transparent", border: "none", color: "var(--pur)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{mais ? "Ocultar" : "Ver todos os canais"}</button>}
        {mais && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>{resto.map((r, i) => <RankCard key={r.c.id} r={r} i={i + 3} meta={d.meta} />)}</div>}
      </>)}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => { set("custo", ""); set("preco", ""); }} style={{ padding: "13px 18px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--tx2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Limpar</button>
        <button onClick={salvar} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: saved ? "var(--grn)" : "var(--pur)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{saved ? <><Check size={16} /> Simulação salva</> : "Salvar Simulação"}</button>
      </div>
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--tx3)" }}><Sparkles size={11} style={{ verticalAlign: "-1px" }} /> Criar anúncio a partir da simulação — em breve</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 11 }}>{children}</div>;
}
function ChannelCard({ c, setCanal }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Badge c={c} size={36} />
        <input value={c.nome} onChange={(e) => setCanal(c.id, "nome", e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: 15.5, fontWeight: 700, color: "var(--tx)", fontFamily: "inherit", flex: 1, minWidth: 0 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--soft)", borderRadius: 9, padding: "7px 11px", marginBottom: 12 }}>
        <Lock size={12} style={{ color: "var(--tx3)", flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: "var(--tx2)", fontWeight: 600 }}>{resumoRegra(c.key)}</span>
      </div>
      {REGRAS[c.key] && REGRAS[c.key].tipo === "modalidade" && (
        <div style={{ marginBottom: 12 }}>
          <Field label="Modalidade do anúncio"><Seg options={[["classico", "Clássico"], ["premium", "Premium"]]} val={c.modo || "classico"} set={(v) => setCanal(c.id, "modo", v)} /></Field>
        </div>
      )}
      {REGRAS[c.key] && REGRAS[c.key].extraCpf && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--tx2)", marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={!!c.cpf450} onChange={(e) => setCanal(c.id, "cpf450", e.target.checked)} style={{ accentColor: "var(--pur)" }} />
          Vendo no CPF com mais de 450 pedidos em 90 dias (+ R$ {REGRAS[c.key].extraCpf},00 por item)
        </label>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Afiliado %"><Input value={c.afi} onChange={(v) => setCanal(c.id, "afi", v)} suffix="%" /></Field>
        <Field label="Frete absorvido R$"><Input value={c.frete} onChange={(v) => setCanal(c.id, "frete", v)} prefix="R$" /></Field>
      </div>
    </div>
  );
}
function FeesForm({ S, set, setCanal }) {
  return (
    <div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
        <SectionLabel>Ajustes gerais</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Seu imposto" hint="vazio = sem imposto"><Input value={S.imposto} onChange={(v) => set("imposto", v)} suffix="%" /></Field>
          <Field label="Margem meta"><Input value={S.alvo} onChange={(v) => set("alvo", v)} suffix="%" /></Field>
          <Field label="Custo de envio / embalagem" hint="por venda"><Input value={S.envio} onChange={(v) => set("envio", v)} prefix="R$" /></Field>
          <Field label="NF-e" hint="por nota"><Input value={S.nfe} onChange={(v) => set("nfe", v)} prefix="R$" /></Field>
          <Field label="Gestão / agência" hint={S.gestaoOn ? "ligado" : "desligado no Simulador"}><Input value={S.gerenc} onChange={(v) => set("gerenc", v)} suffix="%" /></Field>
        </div>
      </div>
      <SectionLabel>Canais que você usa</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {S.canais.map((c) => { const on = (S.ativos || []).includes(c.id); return (
          <button key={c.id} onClick={() => { const a = S.ativos || []; const nv = on ? a.filter((x) => x !== c.id) : [...a, c.id]; if (nv.length) set("ativos", nv); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px 7px 8px", borderRadius: 22, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
              border: on ? "1.5px solid var(--pur)" : "1px solid var(--line)", background: on ? "var(--purBg)" : "var(--card)", color: on ? "var(--pur)" : "var(--tx3)", opacity: on ? 1 : .75 }}>
            <Badge c={c} size={20} />{c.nome}{on && <Check size={14} />}
          </button>
        ); })}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--tx3)", marginBottom: 18 }}>Marque só os que você usa. Com um canal só, o app mostra a venda dele em detalhe.</div>
      <SectionLabel>Canais de venda</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        {canaisAtivos(S).map((c) => <ChannelCard key={c.id} c={c} setCanal={setCanal} />)}
      </div>
    </div>
  );
}

function PrefsForm({ S, set }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", display: "grid", gap: 18, maxWidth: 440 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Tema</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["branco", "Branco", Sun], ["preto", "Preto", Moon]].map(([k, l, Icon]) => (
            <button key={k} onClick={() => set("tema", k)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${S.tema === k ? "var(--pur)" : "var(--line)"}`, background: S.tema === k ? "var(--purBg)" : "transparent", color: S.tema === k ? "var(--pur)" : "var(--tx2)", fontSize: 13, fontWeight: 600 }}><Icon size={16} /> {l}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Visualização</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["auto", "Auto"], ["pc", "PC"], ["celular", "Celular"]].map(([k, l]) => (
            <button key={k} onClick={() => set("layout", k)} style={{ flex: 1, padding: "11px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${S.layout === k ? "var(--pur)" : "var(--line)"}`, background: S.layout === k ? "var(--purBg)" : "transparent", color: S.layout === k ? "var(--pur)" : "var(--tx2)", fontSize: 13, fontWeight: 600 }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>Auto segue o tamanho da tela. PC força o layout de computador.</div>
      </div>
      <button onClick={() => set("usuario", "")} style={{ padding: "11px", borderRadius: 11, border: "1px solid var(--line)", background: "transparent", color: "var(--tx2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair / trocar nome</button>
    </div>
  );
}

function Historico({ S, big }) {
  const list = [...S.historico].reverse().slice(0, big ? 20 : 6);
  return (
    <>
      {list.length === 0 && <div style={{ fontSize: 13, color: "var(--tx3)", padding: "10px 0" }}>Nenhuma ainda. Faça uma simulação e toque em “Salvar”.</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {list.map((h, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "var(--soft)", borderRadius: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.cor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{h.canal}</div><div style={{ fontSize: 11, color: "var(--tx3)" }}>Custo {money(pnum(h.custo))} · Preço {money(pnum(h.preco))}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 13.5, fontWeight: 700, color: h.lucro < 0 ? "var(--red)" : "var(--grn)" }}>{money(h.lucro)}</div><div style={{ fontSize: 11, color: "var(--tx3)" }}>{h.margem.toFixed(1)}%</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmBreve({ titulo, texto, icon: Icon }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--purBg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon size={26} color="var(--pur)" /></div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 13.5, color: "var(--tx2)", lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>{texto}</div>
    </div>
  );
}

function HeroArt() {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", borderRadius: 20, overflow: "hidden", background: "radial-gradient(120% 120% at 50% 15%, var(--purBg), var(--card))", border: "1px solid var(--line)" }}>
      <svg viewBox="0 0 320 200" width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <filter id="cmglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect x="134" y="74" width="52" height="108" rx="12" fill="var(--card)" stroke="var(--pur)" strokeWidth="2" />
        <rect x="142" y="86" width="36" height="66" rx="6" fill="var(--purBg)" />
        <circle cx="90" cy="66" r="14" fill="#EE4D2D" filter="url(#cmglow)" />
        <circle cx="232" cy="58" r="12" fill="#F5C518" filter="url(#cmglow)" />
        <circle cx="118" cy="36" r="9" fill="#2AD5CE" filter="url(#cmglow)" />
        <circle cx="202" cy="32" r="10" fill="#7C5CFC" filter="url(#cmglow)" />
        <circle cx="160" cy="22" r="8" fill="#FB7701" filter="url(#cmglow)" />
        <circle cx="250" cy="96" r="8" fill="#FF6A2C" filter="url(#cmglow)" />
        <circle cx="70" cy="104" r="7" fill="#C9A0FF" filter="url(#cmglow)" />
        <g fill="#fff" opacity="0.9">
          <circle cx="112" cy="72" r="2" /><circle cx="216" cy="82" r="2" /><circle cx="176" cy="46" r="1.6" /><circle cx="60" cy="62" r="1.6" /><circle cx="240" cy="40" r="1.6" />
        </g>
      </svg>
    </div>
  );
}

function Login({ onEnter }) {
  const [nome, setNome] = useState("");
  const [heroErr, setHeroErr] = useState(false);
  const ok = nome.trim().length >= 2;
  const enter = () => { if (ok) onEnter(nome.trim()); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 18 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {!heroErr
          ? <img src="/logos/hero.jpg" alt="" onError={() => setHeroErr(true)} style={{ width: "100%", borderRadius: 20, display: "block" }} />
          : <HeroArt />}
      </div>
      <div style={{ width: "100%", maxWidth: 380, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "26px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx)", marginBottom: 18 }}>Digite seu nome para começar</div>
        <input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enter()} placeholder="Seu nome"
          style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 14px", fontSize: 15, background: "var(--soft)", color: "var(--tx)", outline: "none", fontFamily: "inherit", textAlign: "center", marginBottom: 12 }} />
        <button onClick={enter} disabled={!ok} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: ok ? "var(--pur)" : "var(--line)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: ok ? "pointer" : "default", fontFamily: "inherit" }}>Entrar</button>
      </div>
    </div>
  );
}

/* ---------- MOBILE ---------- */
const M_TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "taxas", label: "Taxas", icon: Percent },
  { id: "analise", label: "Análise", icon: BarChart3 },
  { id: "marketplaces", label: "Canais", icon: Store },
  { id: "perfil", label: "Perfil", icon: User },
];
function MobileShell(props) {
  const { S, d, set, setCanal, salvar, saved, tab, setTab } = props;
  let t = tab; if (t === "dashboard") t = "home"; if (t === "comparativo") t = "analise"; if (t === "alertas") t = "home";
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--pur)", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={19} color="#fff" /></div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Click<span style={{ color: "#E8700F" }}>margem</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{(S.usuario[0] || "D").toUpperCase()}</div>
            <div style={{ lineHeight: 1.1 }}><div style={{ fontSize: 11.5, fontWeight: 700 }}>{S.usuario.split(" ")[0]}</div></div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 90px" }}>
          {t === "home" && <MobileHome S={S} d={d} go={setTab} />}
          {t === "simulador" && <Simulador S={S} d={d} set={set} salvar={salvar} saved={saved} />}
          {t === "produtos" && <Produtos S={S} set={set} mobile />}
          {t === "taxas" && <Taxas S={S} mobile />}
          {t === "marketplaces" && <div><div style={{ fontSize: 22, fontWeight: 700 }}>Marketplaces</div><div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>As taxas de cada canal</div><FeesForm S={S} set={set} setCanal={setCanal} /></div>}
          {t === "analise" && <div><div style={{ fontSize: 22, fontWeight: 700 }}>Análise</div><div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>Comparativo entre plataformas</div><DeskComparativo d={d} /></div>}
          {t === "perfil" && <div><div style={{ fontSize: 22, fontWeight: 700 }}>Perfil</div><div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 16 }}>Preferências do app</div><PrefsForm S={S} set={set} /></div>}
        </div>
        <div style={{ position: "sticky", bottom: 0, display: "flex", background: "var(--bg)", borderTop: "1px solid var(--line)", padding: "8px 6px 10px" }}>
          {M_TABS.map((it) => {
            const on = t === it.id; const Icon = it.icon;
            return <button key={it.id} onClick={() => setTab(it.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", border: "none", background: "transparent", cursor: "pointer", color: on ? "var(--pur)" : "var(--tx3)", fontFamily: "inherit" }}><Icon size={21} /><span style={{ fontSize: 10, fontWeight: on ? 700 : 500 }}>{it.label}</span></button>;
          })}
        </div>
      </div>
    </div>
  );
}
function MobileHome({ S, d, go }) {
  const b = d.ranking[0];
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Olá, {S.usuario.split(" ")[0]} 👋</div>
      <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 18 }}>Onde vale mais vender hoje?</div>
      <div style={{ background: "var(--grnBg)", border: "1px solid var(--grnLn)", borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--grn)", marginBottom: 8 }}>Melhor canal agora</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge c={b.c} size={34} /><div style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{b.c.nome}</div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 800 }}>{money(b.lucro)}</div><div style={{ fontSize: 11.5, color: "var(--grn)", fontWeight: 600 }}>Margem {b.margem.toFixed(1)}%</div></div>
        </div>
      </div>
      <button onClick={() => go("simulador")} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: "var(--pur)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}><Calculator size={18} /> Nova simulação</button>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Últimas simulações</div>
      <Historico S={S} />
    </div>
  );
}

/* ---------- DESKTOP ---------- */
const D_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "simulador", label: "Simulador", icon: Calculator },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "taxas", label: "Taxas", icon: Percent },
  { id: "comparativo", label: "Comparativo", icon: ArrowLeftRight },
  { id: "marketplaces", label: "Marketplaces", icon: Store },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "perfil", label: "Perfil", icon: User },
];
function DesktopShell(props) {
  const { S, d, set, setCanal, salvar, saved, tab, setTab } = props;
  let t = tab; if (t === "home") t = "dashboard";
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 232, background: "var(--bg)", borderRight: "1px solid var(--line)", padding: "22px 16px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--pur)", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={22} color="#fff" /></div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Click<span style={{ color: "#E8700F" }}>margem</span></div>
        </div>
        <nav style={{ display: "grid", gap: 4 }}>
          {D_TABS.map((it) => { const on = t === it.id; const Icon = it.icon; return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: on ? "var(--purBg)" : "transparent", color: on ? "var(--pur)" : "var(--tx2)", fontSize: 13.5, fontWeight: on ? 600 : 500, fontFamily: "inherit" }}><Icon size={18} /> {it.label}</button>
          ); })}
        </nav>
        <div style={{ marginTop: "auto", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{(S.usuario[0] || "D").toUpperCase()}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{S.usuario.split(" ")[0]}</div></div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "clamp(20px,3vw,34px)", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div><div style={{ fontSize: 22, fontWeight: 700 }}>Olá, {S.usuario.split(" ")[0]}! 👋</div><div style={{ fontSize: 13.5, color: "var(--tx2)", marginTop: 2 }}>Veja o desempenho da sua simulação</div></div>
        </div>
        {t === "dashboard" && <DeskDashboard S={S} d={d} setTab={setTab} />}
        {t === "simulador" && <Simulador S={S} d={d} set={set} salvar={salvar} saved={saved} />}
        {t === "produtos" && <Produtos S={S} set={set} />}
        {t === "taxas" && <Taxas S={S} />}
        {t === "comparativo" && <DeskComparativo d={d} />}
        {t === "marketplaces" && <div><H titulo="Marketplaces" sub="As taxas de cada canal — preencha uma vez" /><FeesForm S={S} set={set} setCanal={setCanal} /></div>}
        {t === "alertas" && <EmBreve titulo="Alertas" texto="Avisos de mudança de taxa e de oportunidade de margem — chegam na Fase 2." icon={Bell} />}
        {t === "perfil" && <div><H titulo="Perfil" sub="Preferências do app" /><PrefsForm S={S} set={set} /></div>}
      </main>
    </div>
  );
}
function H({ titulo, sub }) { return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 18, fontWeight: 700 }}>{titulo}</div><div style={{ fontSize: 13, color: "var(--tx2)" }}>{sub}</div></div>; }
function Seg({ options, val, set }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 9, overflow: "hidden", background: "var(--card)" }}>
      {options.map(([k, l]) => <button key={k} onClick={() => set(k)} style={{ padding: "9px 16px", border: "none", cursor: "pointer", background: val === k ? "var(--pur)" : "transparent", color: val === k ? "#fff" : "var(--tx2)", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>{l}</button>)}
    </div>
  );
}
function Hint({ text, dark }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 5 }}>
      <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ cursor: "pointer", width: 14, height: 14, borderRadius: "50%", border: `1px solid ${dark ? "#3A4658" : "var(--tx3)"}`, color: dark ? "#8A94A6" : "var(--tx3)", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontFamily: "Georgia,serif", fontStyle: "italic", flexShrink: 0 }}>i</span>
      {open && (
        <span onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: "150%", left: "50%", transform: "translateX(-50%)", background: "#0E1421", color: "#E7EDF5", border: "1px solid #2A3547", borderRadius: 8, padding: "8px 10px", fontSize: 11.5, fontWeight: 500, lineHeight: 1.45, width: 200, zIndex: 60, boxShadow: "0 12px 32px -8px rgba(0,0,0,.55)", textAlign: "left", fontFamily: "inherit", whiteSpace: "normal" }}>{text}</span>
      )}
    </span>
  );
}
function neonFor(margem, meta) { const dd = margem - meta; return dd >= 10 ? "#3B9EFF" : dd >= 0 ? "#00E39A" : dd > -10 ? "#FFB020" : "#FF476F"; }
function isDark(hex) { if (!hex || hex[0] !== "#") return false; const h = hex.slice(1); const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h; const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16); return (0.299 * r + 0.587 * g + 0.114 * b) < 65; }
function shade(hex, amt) { if (!hex || hex[0] !== "#") return hex; let h = hex.slice(1); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const cl = (x) => Math.max(0, Math.min(255, x)); const r = cl(parseInt(h.slice(0, 2), 16) + amt), g = cl(parseInt(h.slice(2, 4), 16) + amt), b = cl(parseInt(h.slice(4, 6), 16) + amt); return `rgb(${r},${g},${b})`; }
function MetricCard({ icon: Icon, label, value, sub, subColor, hint }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
      <Icon size={18} color="var(--tx3)" />
      <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--tx3)", margin: "12px 0 8px", display: "flex", alignItems: "center" }}>{label}{hint && <Hint text={hint} />}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || "var(--tx3)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}
function DeskDashboard({ S, d, setTab }) {
  const b = d.best;
  const [sel, setSel] = useState(null);
  const detRef = useRef(null);
  const pick = (id) => { setSel(id); setTimeout(() => { if (detRef.current) detRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 0); };
  const sr = d.rows.find((r) => r.c.id === sel) || b;
  const rows = [
    ["Preço de venda", pnum(S.preco), "var(--tx)", null, "O valor que o cliente paga pelo produto."],
    ["Custo do produto", -pnum(S.custo), "var(--tx2)", null, "Quanto o produto custa pra você (compra ou produção)."],
    ["Comissão da plataforma", -sr.comPlat, "var(--tx2)", null, "O percentual que o marketplace cobra sobre cada venda."],
    ["Comissão de afiliado", -sr.comAfi, "var(--tx2)", null, "Percentual pago a quem divulga seu produto (afiliado ou creator). Só entra quando você liga o Afiliado."],
    ["Taxa fixa / transação", -sr.fix, "var(--tx2)", null, "Valor fixo que a plataforma cobra por item vendido — muda conforme a faixa de preço."],
    ["Frete absorvido", -sr.frete, "var(--tx2)", null, "A parte do frete que você paga no lugar do cliente."],
    ["Imposto", -sr.impv, "var(--tx2)", null, "O % de imposto que você paga sobre a venda. Preencha em Marketplaces → Ajustes gerais (vazio = sem imposto)."],
    ["Custo de envio / embalagem", -sr.envio, "var(--tx2)", null, "Etiqueta, embalagem e postagem de cada venda."],
    ["NF-e", -sr.nfe, "var(--tx2)", null, "Custo de emissão da nota fiscal por venda."],
    ["Gestão / agência", -sr.ger, "var(--tx2)", null, "Percentual pago à agência ou gestor que cuida da sua loja. Só entra quando você liga Gestão no Simulador."],
    ["Total de custos e taxas", -(sr.taxas + pnum(S.custo)), "var(--red)", "tot", "Custo do produto + todas as taxas e custos da venda somados."],
    ["Lucro líquido", sr.lucro, sr.lucro < 0 ? "var(--red)" : "var(--grn)", "luc", "O que sobra pra você depois de todas as taxas. O % é a sua margem."],
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14, marginBottom: 24 }}>
        <MetricCard icon={Lightbulb} label="Lucro médio" value={money(d.lucroMedio)} sub="por venda" hint="A média do lucro entre todos os canais nesta simulação." />
        <MetricCard icon={Trophy} label="Melhor canal" value={b.c.nome} sub={`${b.margem.toFixed(1)}% de margem`} subColor="var(--grn)" hint="O canal onde este produto dá o maior lucro." />
        <MetricCard icon={BarChart3} label="Margem média" value={`${d.margemMedia.toFixed(1)}%`} sub="líquida" hint="Quanto sobra em % do preço, em média, depois das taxas." />
        <MetricCard icon={Tag} label="Preço sugerido" value={money(d.sugerido)} sub={`meta ${pnum(S.alvo)}%`} subColor="var(--amb)" hint="O preço que você precisaria cobrar pra bater sua margem meta. É uma estimativa média." />
        <MetricCard icon={ArrowLeftRight} label="Diferença entre canais" value={money(d.gap)} sub={`${b.c.nome} × ${d.worst.c.nome}`} subColor="var(--pur)" hint="Quanto o melhor canal rende a mais que o pior, por venda (o spread)." />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Comparativo por marketplace</div>
        <button onClick={() => setTab("comparativo")} style={{ fontSize: 12.5, color: "var(--pur)", fontWeight: 600, background: "var(--purBg)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>Ver gráfico</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))", gap: 14, marginBottom: 26 }}>
        {d.rows.map((r) => {
          const top = r.c.id === b.c.id, on = top || r.c.id === sr.c.id;
          return (
            <div key={r.c.id} onClick={() => pick(r.c.id)} style={{ cursor: "pointer", background: "var(--card)", borderRadius: 16, padding: "18px 16px", border: on ? "2px solid var(--pur)" : "1px solid var(--line)", position: "relative", textAlign: "center" }}>
              {top && <div style={{ position: "absolute", top: -10, right: 12, background: "var(--pur)", color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", padding: "3px 9px", borderRadius: 20 }}>TOP 1</div>}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Badge c={r.c} size={44} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>{r.c.nome}</div>
              <div style={{ fontSize: 10.5, color: "var(--tx3)", textAlign: "left" }}>Lucro líquido</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: r.lucro < 0 ? "var(--red)" : "var(--grn)", textAlign: "left" }}>{money(r.lucro)}</div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--line)", margin: "10px 0", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, r.margem))}%`, background: mcor(r.margem, d.meta), borderRadius: 3 }} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: mcor(r.margem, d.meta), textAlign: "left" }}>{r.margem.toFixed(1)}%</div>
              <button onClick={() => pick(r.c.id)} style={{ width: "100%", marginTop: 12, padding: "7px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--line)", background: on ? "var(--purBg)" : "transparent", color: on ? "var(--pur)" : "var(--tx2)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>Ver detalhes</button>
            </div>
          );
        })}
      </div>
      <div ref={detRef} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px", maxWidth: 520 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {d.rows.map((r) => { const act = r.c.id === sr.c.id; return (
            <button key={r.c.id} onClick={() => pick(r.c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, cursor: "pointer", border: act ? "1px solid var(--pur)" : "1px solid var(--line)", background: act ? "var(--purBg)" : "transparent", color: act ? "var(--pur)" : "var(--tx2)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c.cor }} />{r.c.nome}</button>
          ); })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Badge c={sr.c} size={30} /><div style={{ fontSize: 15, fontWeight: 700 }}>{sr.c.nome}</div>
          {sr.c.id === b.c.id && <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--grn)", background: "var(--grnBg)", padding: "3px 10px", borderRadius: 20 }}>Melhor resultado</div>}
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 10, fontWeight: 700, color: "var(--tx3)", letterSpacing: ".04em", paddingBottom: 2 }}>
            <span style={{ flex: 1 }} />
            <span style={{ width: 92, textAlign: "right" }}>VALOR</span>
            <span style={{ width: 52, textAlign: "right" }}>%</span>
          </div>
          {rows.map((x, i) => {
            const val = x[1] < 0 ? "− " + money(-x[1]) : money(x[1]);
            const strong = x[3] === "luc" ? 700 : x[3] === "tot" ? 600 : 400;
            const bt = (x[3] === "tot" || x[3] === "luc") ? { borderTop: "1px solid var(--line)", paddingTop: 9, marginTop: 1 } : {};
            const precoV = pnum(S.preco);
            const pct = precoV > 0 ? (Math.abs(x[1]) / precoV) * 100 : 0;
            const pctColor = x[3] === "tot" ? "var(--red)" : x[3] === "luc" ? x[2] : "var(--tx3)";
            return <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 13, ...bt }}><span style={{ color: "var(--tx2)", flex: 1, display: "flex", alignItems: "center" }}>{x[0]}{x[4] && <Hint text={x[4]} />}</span><span style={{ color: x[2], fontWeight: strong, width: 92, textAlign: "right" }}>{val}</span><span style={{ color: pctColor, fontWeight: strong, width: 52, textAlign: "right", fontSize: 12 }}>{pct.toFixed(1)}%</span></div>;
          })}
        </div>
      </div>
    </>
  );
}
function LogoTick({ x, y, payload, data }) {
  const ch = (data || []).find((e) => e.nome === payload.value);
  if (!ch) return null;
  const s = 30;
  return (
    <g transform={`translate(${x - s - 6}, ${y - s / 2})`}>
      <rect width={s} height={s} rx={7} fill="var(--soft)" stroke="var(--line)" />
      <image href={ch.logo} x={3} y={3} width={s - 6} height={s - 6} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}
function CryptoChart({ d }) {
  const [hi, setHi] = useState(null);
  const arr = [...d.ranking].sort((a, b) => a.lucro - b.lucro);
  const W = 320, H = 240, padL = 34, padR = 12, padT = 16, padB = 30;
  const iw = W - padL - padR, ih = H - padT - padB;
  const vals = arr.map((r) => r.lucro);
  const min = Math.min(0, ...vals), max = Math.max(...vals, 1), rng = (max - min) || 1;
  const X = (i) => padL + (arr.length <= 1 ? iw / 2 : (i / (arr.length - 1)) * iw);
  const Y = (v) => padT + (1 - (v - min) / rng) * ih;
  const focus = hi != null ? arr[hi] : d.best;
  const accent = neonFor(focus.margem, d.meta);
  const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
  let path = `M${X(0)},${Y(vals[0])}`;
  for (let i = 1; i < arr.length; i++) { const cx = (X(i - 1) + X(i)) / 2; path += ` C ${cx},${Y(vals[i - 1])} ${cx},${Y(vals[i])} ${X(i)},${Y(vals[i])}`; }
  const area = `${path} L ${X(arr.length - 1)},${padT + ih} L ${X(0)},${padT + ih} Z`;
  const ticks = 3;
  return (
    <div onMouseLeave={() => setHi(null)} style={{ background: "linear-gradient(180deg,#0E1421,#0B1019)", border: "1px solid #1E2838", borderRadius: 16, padding: "16px 16px 8px", color: "#E7EDF5", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", color: accent, border: `1px solid ${accent}55`, background: `${accent}14`, padding: "3px 7px", borderRadius: 6, fontFamily: MONO }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, boxShadow: `0 0 6px ${accent}` }} />AO VIVO
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#8A94A6", fontFamily: MONO }}>LUCRO · BRL<Hint dark text="Passe o mouse (ou toque) num ponto pra ver o lucro e a margem daquele canal. Sem tocar, mostra o melhor." /></span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2, flexWrap: "wrap" }}>
        <span style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO, letterSpacing: "-.02em", color: focus.lucro < 0 ? "#FF476F" : "#E7EDF5" }}>{money(focus.lucro)}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: accent, background: `${accent}22`, padding: "4px 8px", borderRadius: 7, fontFamily: MONO }}>{focus.lucro < 0 ? "▼" : "▲"} {focus.margem.toFixed(1)}%</span>
      </div>
      <div style={{ fontSize: 11, color: "#8A94A6", marginBottom: 6 }}>{hi == null ? <>Melhor <b style={{ color: "#E7EDF5" }}>{d.best.c.nome}</b> · pior <b style={{ color: "#E7EDF5" }}>{d.worst.c.nome}</b></> : <>Vendo em <b style={{ color: "#E7EDF5" }}>{focus.c.nome}</b></>}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible", touchAction: "none" }}>
        <defs>
          <linearGradient id="cgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.34" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient>
          <filter id="cgGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, i) => { const gv = min + rng * i / ticks, gy = Y(gv); return (<g key={i}><line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#18202F" strokeWidth="1" /><text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#525C6E" fontFamily={MONO}>{gv.toFixed(0)}</text></g>); })}
        {min < 0 && <line x1={padL} y1={Y(0)} x2={W - padR} y2={Y(0)} stroke="#2A3547" strokeWidth="1" strokeDasharray="3 3" />}
        <path d={area} fill="url(#cgFill)" />
        <path d={path} fill="none" stroke={accent} strokeWidth="2.4" filter="url(#cgGlow)" strokeLinecap="round" strokeLinejoin="round" />
        {hi != null && <line x1={X(hi)} y1={padT} x2={X(hi)} y2={padT + ih} stroke={accent} strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />}
        {arr.map((r, i) => {
          const foc = hi == null ? r.c.id === d.best.c.id : i === hi;
          return (
            <g key={r.c.id}>
              {foc && <circle cx={X(i)} cy={Y(r.lucro)} r="10" fill={r.c.cor} opacity="0.16" />}
              <circle cx={X(i)} cy={Y(r.lucro)} r={foc ? 7 : 5} fill="#0E1421" stroke={r.c.cor} strokeWidth="2.4" filter="url(#cgGlow)" />
              <circle cx={X(i)} cy={Y(r.lucro)} r={foc ? 3 : 2.2} fill={r.c.cor} />
              <text x={X(i)} y={H - 9} textAnchor="middle" fontSize="9" fontWeight={foc ? 700 : 600} fill={foc ? "#E7EDF5" : "#8A94A6"} fontFamily="Inter,system-ui,sans-serif">{r.c.nome.split(" ")[0]}</text>
            </g>
          );
        })}
        {arr.map((r, i) => { const bx = i === 0 ? 0 : (X(i - 1) + X(i)) / 2; const bx2 = i === arr.length - 1 ? W : (X(i) + X(i + 1)) / 2; return <rect key={"h" + i} x={bx} y={0} width={Math.max(1, bx2 - bx)} height={H} fill="transparent" style={{ cursor: "pointer" }} onMouseEnter={() => setHi(i)} onTouchStart={() => setHi(i)} />; })}
      </svg>
    </div>
  );
}
function DeskComparativo({ d }) {
  const [modo, setModo] = useState("lucro");
  const data = d.ranking.map((r) => ({ id: r.c.id, nome: r.c.nome.split(" ")[0], cor: r.c.cor, logo: r.c.logo, lucro: +r.lucro.toFixed(2), margem: +r.margem.toFixed(1) }));
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <ArrowLeftRight size={20} color="var(--pur)" />
        <div style={{ fontSize: 13.5, color: "var(--tx2)" }}>Vender no <b style={{ color: "var(--tx)" }}>{d.best.c.nome}</b> em vez do <b style={{ color: "var(--tx)" }}>{d.worst.c.nome}</b> rende</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: "var(--grn)" }}>+{money(d.gap)}</span><span style={{ fontSize: 12, color: "var(--tx3)" }}>por par</span></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Comparação entre plataformas</div>
            <Seg options={[["lucro", "Lucro"], ["margem", "Margem"]]} val={modo} set={setModo} />
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 6, right: 20, top: 2, bottom: 2 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={62} tick={<LogoTick data={data} />} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--soft)" }} formatter={(v) => (modo === "lucro" ? money(v) : v + "%")} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)" }} />
                <defs>
                  {data.map((e) => { const dk = isDark(e.cor); return (
                    <linearGradient key={e.id} id={`grad${e.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={shade(e.cor, dk ? 62 : 38)} />
                      <stop offset="48%" stopColor={dk ? shade(e.cor, 38) : shade(e.cor, 6)} />
                      <stop offset="100%" stopColor={shade(e.cor, dk ? 18 : -16)} />
                    </linearGradient>
                  ); })}
                </defs>
                <Bar dataKey={modo} radius={[0, 6, 6, 0]}>{data.map((e) => <Cell key={e.id} fill={`url(#grad${e.id})`} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <CryptoChart d={d} />
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Ranking por lucro líquido</div>
        <div style={{ display: "grid", gap: 4 }}>
          {d.ranking.map((r, i) => (
            <div key={r.c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < d.ranking.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ width: 20, fontSize: 13, fontWeight: 700, color: i === 0 ? "var(--pur)" : "var(--tx3)" }}>{i + 1}</div>
              <Badge c={r.c} size={30} /><div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{r.c.nome}</div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: r.lucro < 0 ? "var(--red)" : mcor(r.margem, meta) }}>{money(r.lucro)}</div><div style={{ fontSize: 11.5, color: mcor(r.margem, d.meta), fontWeight: 600 }}>{r.margem.toFixed(1)}%</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- DETALHE DE UMA VENDA (usado quando a pessoa usa 1 canal só) ---------- */
function DetalheVenda({ S, r, meta }) {
  const preco = pnum(S.preco), custo = pnum(S.custo);
  const pct = (v) => (preco > 0 ? ((Math.abs(v) / preco) * 100).toFixed(1) + "%" : "—");
  const linhas = [
    ["Preço de venda", preco, "var(--tx)"],
    ["Custo do produto", -custo, "var(--tx2)"],
    [`Comissão ${r.c.nome} (${r.pct}%)`, -r.comPlat, "var(--tx2)"],
    ...(r.comAfi ? [["Comissão de afiliado", -r.comAfi, "var(--tx2)"]] : []),
    ["Taxa fixa por item", -r.fix, "var(--tx2)"],
    ...(r.frete ? [["Frete absorvido", -r.frete, "var(--tx2)"]] : []),
    ...(r.impv ? [[`Imposto (${pnum(S.imposto)}%)`, -r.impv, "var(--tx2)"]] : []),
    ["Custo de envio / embalagem", -r.envio, "var(--tx2)"],
    ["NF-e", -r.nfe, "var(--tx2)"],
    ...(r.ger ? [["Gestão / agência", -r.ger, "var(--tx2)"]] : []),
  ];
  const cor = mcor(r.margem, meta);
  const virada = alertaFaixa(S, r.c, custo, preco);
  return (
    <div style={{ background: "var(--card)", border: "1.5px solid var(--pur)", borderRadius: 16, padding: "16px 18px", marginTop: 10 }}>
      {virada && (
        <div style={{ background: "var(--orgBg)", border: "1px solid var(--orgLn)", borderRadius: 12, padding: "10px 12px", marginBottom: 14, fontSize: 12.5, lineHeight: 1.45, color: "var(--tx)" }}>
          <b style={{ color: "var(--org)" }}>Atenção à faixa de preço:</b> vendendo a <b>{money(virada.preco)}</b> você lucra <b>{money(virada.lucro)}</b>, {virada.lucro >= r.lucro ? <>mais do que os {money(r.lucro)} a {money(preco)}</> : <>quase o mesmo que a {money(preco)}</>}. Acima de {money(virada.preco + 0.01)} a {r.c.nome} cobra uma taxa maior.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Badge c={r.c} size={34} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{r.c.nome}</div><div style={{ fontSize: 11, color: "var(--tx3)" }}>Venda detalhada</div></div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--tx3)" }}>Lucro líquido</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: r.lucro < 0 ? "var(--red)" : mcor(r.margem, meta) }}>{money(r.lucro)}</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {linhas.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
            <span style={{ flex: 1, color: "var(--tx2)" }}>{x[0]}</span>
            <span style={{ width: 96, textAlign: "right", color: x[2], fontWeight: i === 0 ? 700 : 500 }}>{x[1] < 0 ? "− " + money(-x[1]) : money(x[1])}</span>
            <span style={{ width: 52, textAlign: "right", fontSize: 11.5, color: "var(--tx3)" }}>{pct(x[1])}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 9 }}>
          <span style={{ flex: 1, fontWeight: 600 }}>Total de custos e taxas</span>
          <span style={{ width: 96, textAlign: "right", color: "var(--red)", fontWeight: 600 }}>− {money(r.taxas + custo)}</span>
          <span style={{ width: 52, textAlign: "right", fontSize: 11.5, color: "var(--red)" }}>{pct(r.taxas + custo)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 14 }}>
          <span style={{ flex: 1, fontWeight: 700 }}>Lucro líquido</span>
          <span style={{ width: 96, textAlign: "right", fontWeight: 800, color: r.lucro < 0 ? "var(--red)" : cor }}>{money(r.lucro)}</span>
          <span style={{ width: 52, textAlign: "right", fontSize: 12, fontWeight: 700, color: cor }}>{r.margem.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ marginTop: 12, height: 6, borderRadius: 4, background: "var(--soft)", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, r.margem))}%`, background: cor }} /></div>
      <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>Margem meta: {meta}%</div>
    </div>
  );
}

/* ---------- PRODUTOS: tabela no formato da planilha do gestor ---------- */
function Produtos({ S, set, mobile }) {
  const ativos = canaisAtivos(S);
  const canal = ativos.find((c) => c.id === S.canalTabela) || ativos[0];
  const lista = S.produtos || [];
  const meta = pnum(S.alvo);
  const upd = (i, k, v) => set("produtos", lista.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const add = () => set("produtos", [...lista, { nome: "", custo: "", preco: "" }]);
  const del = (i) => set("produtos", lista.filter((_, j) => j !== i));
  const linhas = lista.map((p) => ({ p, r: calcVenda(S, canal, pnum(p.custo), pnum(p.preco)) }));
  const validas = linhas.filter((x) => pnum(x.p.preco) > 0);
  const lucroMedio = validas.length ? validas.reduce((a, x) => a + x.r.lucro, 0) / validas.length : 0;
  const margemMedia = validas.length ? validas.reduce((a, x) => a + x.r.margem, 0) / validas.length : 0;
  const n2 = (v) => v.toFixed(2).replace(".", ",");
  const exportar = () => {
    const cab = ["Produto","Custo Envio","Custo Produto","Preço de Venda","NF-e","Taxa %","Imposto","Gestão","Taxa $","Lucro","Margem"];
    const rows = linhas.map(({ p, r }) => [p.nome, n2(r.envio), n2(pnum(p.custo)), n2(pnum(p.preco)), n2(r.nfe), n2(r.comPlat + r.comAfi), n2(r.impv), n2(r.ger), n2(r.fix + r.frete), n2(r.lucro), r.margem.toFixed(0) + "%"]);
    const csv = "﻿" + [cab, ...rows].map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `produtos-${canal.nome.toLowerCase().replace(/\s+/g, "-")}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };
  const th = { padding: "10px 8px", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "right", whiteSpace: "nowrap", borderBottom: "2px solid var(--line)" };
  const grp = { padding: "8px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", textAlign: "center" };
  const hP = { background: "var(--purBg)", color: "var(--pur)" }, hA = { background: "var(--ambBg)", color: "var(--amb)" }, hG = { background: "var(--grnBg)", color: "var(--grn)" };
  const td = { padding: "6px 8px", fontSize: 13, textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
  const cell = (v, w, onChange, left) => <input value={v} onChange={(e) => onChange(e.target.value)} inputMode={left ? "text" : "decimal"} placeholder={left ? "Nome / SKU" : "0,00"}
    style={{ width: w, border: "1px solid var(--line)", borderRadius: 8, padding: "7px 8px", fontSize: 13, fontWeight: 600, background: "var(--soft)", color: "var(--tx)", outline: "none", fontFamily: "inherit", textAlign: left ? "left" : "right" }} />;
  const box = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div><div style={{ fontSize: mobile ? 22 : 18, fontWeight: 700 }}>Produtos</div><div style={{ fontSize: 13, color: "var(--tx2)" }}>Lucro e margem de cada produto{ativos.length > 1 ? " no canal escolhido" : ` na ${canal.nome}`}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ativos.length > 1 && (
            <select value={canal.id} onChange={(e) => set("canalTabela", Number(e.target.value))}
              style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", color: "var(--tx)", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              {ativos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          <button onClick={exportar} disabled={!lista.length} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", color: "var(--tx2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}><Download size={15} /> Excel</button>
        </div>
      </div>
      {validas.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={box}><div style={{ fontSize: 10.5, color: "var(--tx3)" }}>PRODUTOS</div><div style={{ fontSize: 17, fontWeight: 700 }}>{validas.length}</div></div>
          <div style={box}><div style={{ fontSize: 10.5, color: "var(--tx3)" }}>LUCRO MÉDIO</div><div style={{ fontSize: 17, fontWeight: 700, color: lucroMedio < 0 ? "var(--red)" : mcor(margemMedia, meta) }}>{money(lucroMedio)}</div></div>
          <div style={box}><div style={{ fontSize: 10.5, color: "var(--tx3)" }}>MARGEM MÉDIA</div><div style={{ fontSize: 17, fontWeight: 700, color: mcor(margemMedia, meta) }}>{margemMedia.toFixed(1)}%</div></div>
        </div>
      )}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 980 }}>
          <thead>
            <tr>
              <th colSpan={3} style={{ ...grp, background: "var(--pur)", color: "#fff", borderTopLeftRadius: 15 }}>Produto</th>
              <th colSpan={6} style={{ ...grp, background: "var(--amb)", color: "#fff" }}>Custos e taxas por venda</th>
              <th colSpan={3} style={{ ...grp, background: "var(--grn)", color: "#fff", borderTopRightRadius: 15 }}>Resultado</th>
            </tr>
            <tr>
              <th style={{ ...th, ...hP, textAlign: "left" }}>Nome / SKU</th><th style={{ ...th, ...hP }}>Custo produto</th><th style={{ ...th, ...hP }}>Preço de venda</th>
              <th style={{ ...th, ...hA }}>Envio</th><th style={{ ...th, ...hA }}>NF-e</th><th style={{ ...th, ...hA }}>Taxa %</th><th style={{ ...th, ...hA }}>Imposto</th><th style={{ ...th, ...hA }}>Gestão</th><th style={{ ...th, ...hA }}>Taxa $</th>
              <th style={{ ...th, ...hG }}>Lucro</th><th style={{ ...th, ...hG }}>Margem</th><th style={{ ...th, ...hG }}></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ p, r }, i) => {
              const tem = pnum(p.preco) > 0;
              return (
                <tr key={i} style={{ background: i % 2 ? "var(--soft)" : "var(--card)" }}>
                  <td style={{ ...td, textAlign: "left" }}>{cell(p.nome, 130, (v) => upd(i, "nome", v), true)}</td>
                  <td style={td}>{cell(p.custo, 86, (v) => upd(i, "custo", v))}</td>
                  <td style={td}>{cell(p.preco, 86, (v) => upd(i, "preco", v))}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{money(r.envio)}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{money(r.nfe)}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{tem ? money(r.comPlat + r.comAfi) : "—"}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{tem ? money(r.impv) : "—"}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{tem ? money(r.ger) : "—"}</td>
                  <td style={{ ...td, color: "var(--tx2)" }}>{tem ? money(r.fix + r.frete) : "—"}</td>
                  <td style={{ ...td, fontWeight: 700, color: !tem ? "var(--tx3)" : r.lucro < 0 ? "var(--red)" : mcor(r.margem, meta) }}>{tem ? money(r.lucro) : "—"}</td>
                  <td style={td}>{tem ? <span style={{ fontSize: 12, fontWeight: 700, color: mcor(r.margem, meta), background: "var(--soft)", padding: "3px 8px", borderRadius: 20 }}>{r.margem.toFixed(0)}%</span> : "—"}</td>
                  <td style={td}><button onClick={() => del(i)} title="Remover" style={{ border: "none", background: "transparent", color: "var(--tx3)", cursor: "pointer", padding: 4 }}><Trash2 size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lista.length && <div style={{ padding: "26px 20px", textAlign: "center", fontSize: 13, color: "var(--tx3)" }}>Nenhum produto ainda. Adicione o primeiro.</div>}
      </div>
      <button onClick={add} style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: mobile ? "100%" : "auto", padding: "12px 18px", borderRadius: 12, border: "none", background: "var(--pur)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><Plus size={16} /> Adicionar produto</button>
      <div style={{ fontSize: 11.5, color: "var(--tx3)", marginTop: 12, lineHeight: 1.5 }}>
        Imposto, custo de envio, NF-e e gestão vêm dos <b>Ajustes gerais</b> (aba Marketplaces). Taxa % e Taxa $ seguem a regra do canal pela faixa de preço.
      </div>
    </div>
  );
}

/* ---------- TAXAS: consulta clara das regras de cada plataforma ---------- */
function faixasDe(key) {
  const r = REGRAS[key]; if (!r) return [];
  const f2 = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (r.tipo === "flat") return [{ faixa: "Qualquer preço", pct: r.pct, fixo: r.fixo || 0, de: 0, ate: Infinity }];
  if (r.tipo === "faixas") { let de = 0; const pre = [];
    if (r.metadeAte) { pre.push({ faixa: `Até R$ ${f2(r.metadeAte)}`, pct: 50, fixo: 0, de: 0, ate: r.metadeAte, obs: "metade do preço" }); de = r.metadeAte + 0.01; }
    return pre.concat(r.faixas.map((f) => { const o = { faixa: f.ate === Infinity ? `A partir de R$ ${f2(de)}` : de === 0 ? `Até R$ ${f2(f.ate)}` : `R$ ${f2(de)} a R$ ${f2(f.ate)}`, pct: f.pct, fixo: f.fixo || 0, de, ate: f.ate }; de = f.ate + 0.01; return o; })); }
  if (r.tipo === "modalidade") {
    const out = [];
    ["classico", "premium"].forEach((m) => {
      const nome = m === "classico" ? "Clássico" : "Premium", pct = r.modos[m].pct; let de = 0;
      (r.fixoFaixas || []).forEach((ff) => {
        out.push({ faixa: `${nome} · ${de === 0 ? "até" : "R$ " + f2(de) + " a"} R$ ${f2(ff.ate)}`, pct, fixo: ff.metade ? 0 : ff.valor, metade: !!ff.metade, de, ate: ff.ate, modo: m });
        de = ff.ate + 0.01;
      });
      out.push({ faixa: `${nome} · R$ ${f2(r.unidadeAbaixoDe)} ou mais`, pct, fixo: 0, de: r.unidadeAbaixoDe, ate: Infinity, modo: m, obs: "sem custo fixo · frete grátis obrigatório" });
    });
    return out;
  }
  return [];
}
function Taxas({ S, mobile }) {
  const preco = pnum(S.preco);
  const ativos = canaisAtivos(S).map((c) => c.id);
  const ordem = [...S.canais].sort((a, b) => (ativos.includes(b.id) ? 1 : 0) - (ativos.includes(a.id) ? 1 : 0));
  const th = { padding: "9px 10px", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--pur)", background: "var(--purBg)", textAlign: "left", borderBottom: "2px solid var(--line)" };
  const td = { padding: "10px", fontSize: 13, borderBottom: "1px solid var(--line)" };
  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ fontSize: mobile ? 22 : 18, fontWeight: 700 }}>Taxas das plataformas</div>
      <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 6 }}>Quanto cada marketplace cobra por venda. O app já usa essas regras nas contas.</div>
      {preco > 0 && <div style={{ fontSize: 12.5, color: "var(--tx2)", background: "var(--purBg)", borderRadius: 10, padding: "9px 12px", marginBottom: 16 }}>A linha destacada é a faixa do seu preço simulado: <b style={{ color: "var(--pur)" }}>{money(preco)}</b></div>}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0,1fr)" }}>
        {ordem.map((c) => {
          const info = INFO_TAXAS[c.key] || { notas: [] };
          const fx = faixasDe(c.key);
          const usa = ativos.includes(c.id);
          const aconf = info.atualizado === "a confirmar";
          return (
            <div key={c.id} style={{ background: "var(--card)", border: usa ? "1.5px solid var(--pur)" : "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", opacity: usa ? 1 : .8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <Badge c={c} size={32} />
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{c.nome}{usa && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--pur)", padding: "2px 7px", borderRadius: 20, verticalAlign: "2px" }}>VOCÊ USA</span>}</div>
                  <div style={{ fontSize: 11.5, color: aconf ? "var(--org)" : "var(--tx3)" }}>{aconf ? "Taxa a confirmar" : `Atualizado em ${info.atualizado}`}</div>
                </div>
                {info.fonte && <a href={info.fonte} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--pur)", textDecoration: "none" }}>Fonte oficial <ExternalLink size={13} /></a>}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: mobile ? 330 : 420 }}>
                  <thead><tr><th style={th}>Preço do produto</th><th style={th}>Comissão</th><th style={th}>Taxa fixa por item</th><th style={{ ...th, textAlign: "right" }}>{preco > 0 ? (mobile ? "Taxa total" : `Na venda de ${money(preco)}`) : "Exemplo R$ 100"}</th></tr></thead>
                  <tbody>
                    {fx.map((f, i) => {
                      const base = preco > 0 ? preco : 100;
                      const naFaixa = preco > 0 && preco >= f.de && preco <= f.ate && (!f.modo || f.modo === (c.modo || "classico"));
                      const custo = base * f.pct / 100 + (f.metade ? base * 0.5 : f.fixo);
                      return (
                        <tr key={i} style={{ background: naFaixa ? "var(--purBg)" : "transparent" }}>
                          <td style={{ ...td, fontWeight: naFaixa ? 700 : 500 }}>{f.faixa}</td>
                          <td style={td}>{f.obs === "metade do preço" ? "—" : f.pct + "%"}</td>
                          <td style={td}>{f.metade ? "50% do preço" : f.fixo ? money(f.fixo) : "—"}{f.obs && <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2 }}>{f.obs}</div>}</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 600, color: naFaixa ? "var(--pur)" : "var(--tx3)" }}>{(preco > 0 && !naFaixa) ? "—" : <>{money(custo)} <span style={{ fontSize: 11, color: "var(--tx3)", fontWeight: 500 }}>({(custo / base * 100).toFixed(1)}%)</span></>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {info.notas.length > 0 && (
                <ul style={{ margin: "12px 0 0", paddingLeft: 18, display: "grid", gap: 5 }}>
                  {info.notas.map((n, i) => <li key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.45 }}>{n}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--tx3)", marginTop: 14, lineHeight: 1.5 }}>As plataformas mudam as taxas de tempos em tempos. Antes de decisões grandes, confira na fonte oficial.</div>
    </div>
  );
}

/* Alerta: o preço caiu logo acima de uma virada de faixa (ex.: Shopee R$ 80) e vender na faixa de baixo rende igual ou mais */
function alertaFaixa(S, c, custo, preco) {
  const r = REGRAS[c.key];
  if (!r || r.tipo !== "faixas" || preco <= 0) return null;
  for (const f of r.faixas) {
    if (f.ate === Infinity) continue;
    const limite = f.ate;
    if (preco > limite && preco <= limite * 1.25) {
      const agora = calcVenda(S, c, custo, preco).lucro;
      const baixo = calcVenda(S, c, custo, limite).lucro;
      if (baixo >= agora - 1) return { preco: limite, lucro: baixo };
    }
  }
  return null;
}
