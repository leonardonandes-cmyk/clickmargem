import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp, Home as HomeIcon, Calculator, Store, Bell, User,
  Gem, Sun, Moon, Check, Sparkles, LayoutDashboard, ArrowLeftRight,
  Trophy, Tag, BarChart3, Lightbulb, ChevronDown, Lock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ---------- Temas ---------- */
const THEMES = {
  branco: {
    "--bg": "#FFFFFF", "--app": "#F1F1F5", "--card": "#FFFFFF", "--soft": "#F6F6F9",
    "--line": "#ECECF1", "--tx": "#1B1B23", "--tx2": "#4A4B56", "--tx3": "#64656F",
    "--pur": "#6C4FF5", "--purBg": "#EEEBFF",
    "--grn": "#1FAE63", "--grnBg": "#E9F7EF", "--grnLn": "#CDEBD8",
    "--amb": "#C79A1E", "--ambBg": "#FBF6DF", "--ambLn": "#EFE6AE",
    "--org": "#D97A34", "--orgBg": "#FBEEE4", "--orgLn": "#F1D8C4",
    "--red": "#E5533C", "--blu": "#2F7DD1",
  },
  preto: {
    "--bg": "#0C0D11", "--app": "#000000", "--card": "#16171D", "--soft": "#1B1C23",
    "--line": "#282A33", "--tx": "#F1F2F5", "--tx2": "#A0A2AC", "--tx3": "#6C6E78",
    "--pur": "#7C6FF0", "--purBg": "#241F3D",
    "--grn": "#38D26B", "--grnBg": "#14301F", "--grnLn": "#1F4A31",
    "--amb": "#F2C24C", "--ambBg": "#302A14", "--ambLn": "#4A3F1F",
    "--org": "#F0955A", "--orgBg": "#301F14", "--orgLn": "#4A311F",
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
  tiktok: { tipo: "faixas", faixas: [ { ate: 49.99, pct: 10, fixo: 6 }, { ate: Infinity, pct: 6, fixo: 6 } ] },
  shopee: { tipo: "faixas", faixas: [ { ate: 79.99, pct: 20, fixo: 4 }, { ate: 99.99, pct: 14, fixo: 16 }, { ate: 199.99, pct: 14, fixo: 20 }, { ate: Infinity, pct: 14, fixo: 26 } ] },
  ml:     { tipo: "modalidade", modos: { classico: { pct: 14 }, premium: { pct: 19 } }, unidadeAbaixoDe: 79, unidadeValor: 6 },
};
// Motor: dado o canal, o preço e a modalidade, devolve % + taxa fixa + teto da faixa certa
function taxaCanal(key, preco, modo) {
  const r = REGRAS[key];
  if (!r) return { pct: 0, fixo: 0, teto: null };
  if (r.tipo === "flat") return { pct: r.pct, fixo: r.fixo || 0, teto: null };
  if (r.tipo === "faixas") {
    const f = r.faixas.find((x) => preco <= x.ate) || r.faixas[r.faixas.length - 1];
    return { pct: f.pct, fixo: f.fixo || 0, teto: f.teto || null };
  }
  if (r.tipo === "modalidade") {
    const m = r.modos[modo] || r.modos.classico;
    const fixo = preco < (r.unidadeAbaixoDe || 0) ? (r.unidadeValor || 0) : 0;
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
  if (r.tipo === "modalidade") return `Clássico ${r.modos.classico.pct}% · Premium ${r.modos.premium.pct}%`;
  return "—";
}

const DEFAULT = {
  tema: "branco", regime: "CPF", layout: "auto", usuario: "", afiliado: false, freteOn: true, alvo: "30", imposto: "6",
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

  const imp = S.regime === "CNPJ" ? pnum(S.imposto) : 0;
  const custoN = pnum(S.custo), precoN = pnum(S.preco);

  const d = useMemo(() => {
    const rows = S.canais.map((c) => {
      const rg = taxaCanal(c.key, precoN, c.modo);
      let comPlat = precoN * (rg.pct / 100);
      if (rg.teto) comPlat = Math.min(comPlat, rg.teto);
      const comAfi = S.afiliado ? precoN * (pnum(c.afi) / 100) : 0;
      const fix = rg.fixo, frete = S.freteOn ? pnum(c.frete) : 0, impv = precoN * (imp / 100);
      const taxas = comPlat + comAfi + fix + frete + impv;
      const lucro = precoN - custoN - taxas;
      const margem = precoN > 0 ? (lucro / precoN) * 100 : 0;
      return { c, comPlat, comAfi, fix, frete, impv, taxas, lucro, margem, pct: rg.pct };
    });
    const ranking = [...rows].sort((a, b) => b.lucro - a.lucro);
    const best = ranking[0], worst = ranking[ranking.length - 1];
    const gap = best.lucro - worst.lucro;
    const lucroMedio = rows.reduce((a, b) => a + b.lucro, 0) / rows.length;
    const margemMedia = rows.reduce((a, b) => a + b.margem, 0) / rows.length;
    let rateSum = 0, fixSum = 0;
    S.canais.forEach((c) => { const rg = taxaCanal(c.key, precoN, c.modo); rateSum += (rg.pct + (S.afiliado ? pnum(c.afi) : 0) + imp) / 100; fixSum += rg.fixo + (S.freteOn ? pnum(c.frete) : 0); });
    const den = 1 - rateSum / rows.length - pnum(S.alvo) / 100;
    const sugerido = den > 0 ? (custoN + fixSum / rows.length) / den : 0;
    return { rows, ranking, best, worst, gap, lucroMedio, margemMedia, sugerido, meta: pnum(S.alvo) };
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
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Simulador Rápido</div>
      <div style={{ fontSize: 13, color: "var(--tx2)", marginBottom: 18 }}>Insira os dados do produto</div>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Custo do Produto (R$)"><Input value={S.custo} onChange={(v) => set("custo", v)} prefix="R$" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Preço Desejado (R$)"><Input value={S.preco} onChange={(v) => set("preco", v)} prefix="R$" /></Field>
          <Field label="Preço Sugerido" hint={`meta ${pnum(S.alvo)}%`}><Input value={money(d.sugerido).replace("R$", "").trim()} prefix="R$" muted readOnly /></Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <OpToggle label="Afiliado" val={S.afiliado} set={(v) => set("afiliado", v)} />
        <OpToggle label="Frete" val={S.freteOn} set={(v) => set("freteOn", v)} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, margin: "24px 0 4px" }}>Resultados da Simulação</div>
      <div style={{ fontSize: 11.5, color: "var(--tx3)", marginBottom: 12 }}>Top 3 marketplaces</div>
      <div style={{ display: "grid", gap: 12 }}>
        {top3.map((r, i) => <RankCard key={r.c.id} r={r} i={i} meta={d.meta} />)}
      </div>
      <button onClick={() => setMais((m) => !m)} style={{ width: "100%", marginTop: 12, padding: "10px", background: "transparent", border: "none", color: "var(--pur)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{mais ? "Ocultar" : "Ver todos os canais"}</button>
      {mais && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>{resto.map((r, i) => <RankCard key={r.c.id} r={r} i={i + 3} meta={d.meta} />)}</div>}

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
          <Field label="Imposto Simples (CNPJ)"><Input value={S.imposto} onChange={(v) => set("imposto", v)} suffix="%" /></Field>
          <Field label="Margem meta"><Input value={S.alvo} onChange={(v) => set("alvo", v)} suffix="%" /></Field>
        </div>
      </div>
      <SectionLabel>Canais de venda</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        {S.canais.map((c) => <ChannelCard key={c.id} c={c} setCanal={setCanal} />)}
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
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Tipo de venda</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["CPF", "CNPJ"].map((r) => (
            <button key={r} onClick={() => set("regime", r)} style={{ flex: 1, padding: "11px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${S.regime === r ? "var(--pur)" : "var(--line)"}`, background: S.regime === r ? "var(--purBg)" : "transparent", color: S.regime === r ? "var(--pur)" : "var(--tx2)", fontSize: 13, fontWeight: 600 }}>{r}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>{S.regime === "CPF" ? "Sem imposto." : `Imposto Simples de ${pnum(S.imposto)}% aplicado.`}</div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Gem size={18} color="var(--pur)" /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Plano Premium</div><div style={{ fontSize: 11, color: "var(--tx3)" }}>Sua assinatura está ativa</div></div></div>
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
  { id: "analise", label: "Análise", icon: BarChart3 },
  { id: "marketplaces", label: "Marketplaces", icon: Store },
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
            <div style={{ fontSize: 16, fontWeight: 700 }}>Click<span style={{ color: "var(--pur)" }}>margem</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{(S.usuario[0] || "D").toUpperCase()}</div>
            <div style={{ lineHeight: 1.1 }}><div style={{ fontSize: 11.5, fontWeight: 700 }}>{S.usuario.split(" ")[0]}</div><div style={{ fontSize: 9.5, color: "var(--tx3)" }}>Premium</div></div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 90px" }}>
          {t === "home" && <MobileHome S={S} d={d} go={setTab} />}
          {t === "simulador" && <Simulador S={S} d={d} set={set} salvar={salvar} saved={saved} />}
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>Click<span style={{ color: "var(--pur)" }}>margem</span></div>
        </div>
        <nav style={{ display: "grid", gap: 4 }}>
          {D_TABS.map((it) => { const on = t === it.id; const Icon = it.icon; return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: on ? "var(--purBg)" : "transparent", color: on ? "var(--pur)" : "var(--tx2)", fontSize: 13.5, fontWeight: on ? 600 : 500, fontFamily: "inherit" }}><Icon size={18} /> {it.label}</button>
          ); })}
        </nav>
        <div style={{ marginTop: "auto", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{(S.usuario[0] || "D").toUpperCase()}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{S.usuario.split(" ")[0]}</div><div style={{ fontSize: 10.5, color: "var(--tx3)" }}>Conta Premium</div></div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "clamp(20px,3vw,34px)", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div><div style={{ fontSize: 22, fontWeight: 700 }}>Olá, {S.usuario.split(" ")[0]}! 👋</div><div style={{ fontSize: 13.5, color: "var(--tx2)", marginTop: 2 }}>Veja o desempenho da sua simulação</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tx2)" }}>Tipo de venda</span>
            <Seg options={[["CPF", "CPF"], ["CNPJ", "CNPJ"]]} val={S.regime} set={(v) => set("regime", v)} />
          </div>
        </div>
        {t === "dashboard" && <DeskDashboard S={S} d={d} setTab={setTab} />}
        {t === "simulador" && <Simulador S={S} d={d} set={set} salvar={salvar} saved={saved} />}
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
    ["Comissão da plataforma", -sr.comPlat, "var(--tx2)", null, "O percentual que o marketplace cobra sobre cada venda."],
    ["Comissão de afiliado", -sr.comAfi, "var(--tx2)", null, "Percentual pago a quem divulga seu produto (afiliado ou creator). Só entra quando você liga o Afiliado."],
    ["Taxa fixa / transação", -sr.fix, "var(--tx2)", null, "Valor fixo que a plataforma cobra por item vendido — muda conforme a faixa de preço."],
    ["Frete absorvido", -sr.frete, "var(--tx2)", null, "A parte do frete que você paga no lugar do cliente."],
    [`Imposto${S.regime === "CPF" ? " (isento)" : ""}`, -sr.impv, "var(--tx2)", null, "Imposto sobre a venda (Simples Nacional). No CPF fica isento."],
    ["Total de taxas", -sr.taxas, "var(--red)", "tot", "Tudo que a venda consome de taxas somado. O % ao lado é a % Operação: quanto o canal come da sua venda."],
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
  const s = 26;
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
                <YAxis type="category" dataKey="nome" width={56} tick={<LogoTick data={data} />} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "var(--soft)" }} formatter={(v) => (modo === "lucro" ? money(v) : v + "%")} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)" }} />
                <Bar dataKey={modo} radius={[0, 6, 6, 0]}>{data.map((e) => <Cell key={e.id} fill={e.cor} />)}</Bar>
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
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: r.lucro < 0 ? "var(--red)" : "var(--grn)" }}>{money(r.lucro)}</div><div style={{ fontSize: 11.5, color: mcor(r.margem, d.meta), fontWeight: 600 }}>{r.margem.toFixed(1)}%</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
