import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Home as HomeIcon, Calculator, Store, Bell, User,
  Gem, Sun, Moon, Check, Sparkles, LayoutDashboard, ArrowLeftRight,
  Trophy, Tag, BarChart3, Lightbulb, ChevronDown,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ---------- Temas ---------- */
const THEMES = {
  branco: {
    "--bg": "#FFFFFF", "--app": "#F1F1F5", "--card": "#FFFFFF", "--soft": "#F6F6F9",
    "--line": "#ECECF1", "--tx": "#1B1B23", "--tx2": "#6E6E7A", "--tx3": "#A6A6B2",
    "--pur": "#6C4FF5", "--purBg": "#EEEBFF",
    "--grn": "#1FAE63", "--grnBg": "#E9F7EF", "--grnLn": "#CDEBD8",
    "--amb": "#C79A1E", "--ambBg": "#FBF6DF", "--ambLn": "#EFE6AE",
    "--org": "#D97A34", "--orgBg": "#FBEEE4", "--orgLn": "#F1D8C4",
    "--red": "#E5533C",
  },
  preto: {
    "--bg": "#0C0D11", "--app": "#000000", "--card": "#16171D", "--soft": "#1B1C23",
    "--line": "#282A33", "--tx": "#F1F2F5", "--tx2": "#A0A2AC", "--tx3": "#6C6E78",
    "--pur": "#7C6FF0", "--purBg": "#241F3D",
    "--grn": "#38D26B", "--grnBg": "#14301F", "--grnLn": "#1F4A31",
    "--amb": "#F2C24C", "--ambBg": "#302A14", "--ambLn": "#4A3F1F",
    "--org": "#F0955A", "--orgBg": "#301F14", "--orgLn": "#4A311F",
    "--red": "#F26D5B",
  },
};

/* ---------- Helpers ---------- */
const money = (n) => { const v = !isFinite(n) || n === 0 ? 0 : n; return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
const pnum = (s) => { if (typeof s === "number") return s; const v = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isNaN(v) ? 0 : v; };
const ini = (n) => (n.trim()[0] || "?").toUpperCase();
const txtOn = (hex) => { const h = hex.replace("#", ""); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1B1B23" : "#FFFFFF"; };
const mcor = (m) => (m >= 30 ? "var(--grn)" : m >= 15 ? "var(--amb)" : "var(--red)");

const DEFAULT = {
  tema: "branco", regime: "CPF", layout: "auto", afiliado: false, freteOn: true, alvo: "30", imposto: "6",
  custo: "45,00", preco: "64,90",
  canais: [
    { id: 1, nome: "Kwai", cor: "#FF6A2C", logo: "/logos/kwai.svg", com: "8", afi: "0", fix: "0,00", frete: "0,00" },
    { id: 2, nome: "TikTok Shop", cor: "#111318", logo: "/logos/tiktok.svg", com: "6", afi: "3", fix: "1,20", frete: "0,00" },
    { id: 3, nome: "Temu", cor: "#FB7701", logo: "/logos/temu.svg", com: "15", afi: "0", fix: "0,00", frete: "0,00" },
    { id: 4, nome: "Shein", cor: "#111318", logo: "/logos/shein.svg", com: "16", afi: "0", fix: "0,00", frete: "0,00" },
    { id: 5, nome: "Shopee", cor: "#EE4D2D", logo: "/logos/shopee.svg", com: "14", afi: "0", fix: "4,00", frete: "0,00" },
    { id: 6, nome: "Mercado Livre", cor: "#F5C518", logo: "/logos/mercadolivre.svg", com: "14", afi: "0", fix: "6,00", frete: "0,00" },
  ],
  historico: [],
};

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
    try { const raw = localStorage.getItem("marginpro-mvp"); if (raw) setS({ ...DEFAULT, ...JSON.parse(raw) }); } catch (e) {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem("marginpro-mvp", JSON.stringify(S)); } catch (e) {} }, [S, loaded]);

  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const setCanal = (id, k, v) => setS((p) => ({ ...p, canais: p.canais.map((c) => (c.id === id ? { ...c, [k]: v } : c)) }));

  const imp = S.regime === "CNPJ" ? pnum(S.imposto) : 0;
  const custoN = pnum(S.custo), precoN = pnum(S.preco);

  const d = useMemo(() => {
    const rows = S.canais.map((c) => {
      const comPlat = precoN * (pnum(c.com) / 100);
      const comAfi = S.afiliado ? precoN * (pnum(c.afi) / 100) : 0;
      const fix = pnum(c.fix), frete = S.freteOn ? pnum(c.frete) : 0, impv = precoN * (imp / 100);
      const taxas = comPlat + comAfi + fix + frete + impv;
      const lucro = precoN - custoN - taxas;
      const margem = precoN > 0 ? (lucro / precoN) * 100 : 0;
      return { c, comPlat, comAfi, fix, frete, impv, taxas, lucro, margem };
    });
    const ranking = [...rows].sort((a, b) => b.lucro - a.lucro);
    const best = ranking[0], worst = ranking[ranking.length - 1];
    const gap = best.lucro - worst.lucro;
    const lucroMedio = rows.reduce((a, b) => a + b.lucro, 0) / rows.length;
    const margemMedia = rows.reduce((a, b) => a + b.margem, 0) / rows.length;
    let rateSum = 0, fixSum = 0;
    S.canais.forEach((c) => { rateSum += (pnum(c.com) + pnum(c.afi) + imp) / 100; fixSum += pnum(c.fix) + (S.freteOn ? pnum(c.frete) : 0); });
    const den = 1 - rateSum / rows.length - pnum(S.alvo) / 100;
    const sugerido = den > 0 ? (custoN + fixSum / rows.length) / den : 0;
    return { rows, ranking, best, worst, gap, lucroMedio, margemMedia, sugerido };
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
      {isNarrow ? <MobileShell {...shared} /> : <DesktopShell {...shared} />}
    </div>
  );
}

/* ---------- Componentes compartilhados ---------- */
function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--tx2)" }}>{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: "var(--tx3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function Input({ value, onChange, prefix, suffix, muted, readOnly }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: muted ? "var(--soft)" : "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
      {prefix && <span style={{ color: "var(--tx3)", fontSize: 14, marginRight: 5 }}>{prefix}</span>}
      <input value={value} onChange={(e) => onChange && onChange(e.target.value)} inputMode="decimal" readOnly={readOnly}
        style={{ border: "none", outline: "none", background: "transparent", width: "100%", minWidth: 0, fontSize: 16, fontWeight: 600, color: muted ? "var(--tx3)" : "var(--tx)", fontFamily: "inherit" }} />
      {suffix && <span style={{ color: "var(--tx3)", fontSize: 14 }}>{suffix}</span>}
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
function RankCard({ r, i }) {
  const destaque = i === 0;
  const ch = mcor(r.margem);
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
        {top3.map((r, i) => <RankCard key={r.c.id} r={r} i={i} />)}
      </div>
      <button onClick={() => setMais((m) => !m)} style={{ width: "100%", marginTop: 12, padding: "10px", background: "transparent", border: "none", color: "var(--pur)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{mais ? "Ocultar" : "Ver todos os canais"}</button>
      {mais && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>{resto.map((r, i) => <RankCard key={r.c.id} r={r} i={i + 3} />)}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => { set("custo", ""); set("preco", ""); }} style={{ padding: "13px 18px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--tx2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Limpar</button>
        <button onClick={salvar} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: saved ? "var(--grn)" : "var(--pur)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{saved ? <><Check size={16} /> Simulação salva</> : "Salvar Simulação"}</button>
      </div>
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "var(--tx3)" }}><Sparkles size={11} style={{ verticalAlign: "-1px" }} /> Criar anúncio a partir da simulação — em breve</div>
    </div>
  );
}

function FeesForm({ S, set, setCanal }) {
  return (
    <div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Imposto Simples (CNPJ)"><Input value={S.imposto} onChange={(v) => set("imposto", v)} suffix="%" /></Field>
          <Field label="Margem meta"><Input value={S.alvo} onChange={(v) => set("alvo", v)} suffix="%" /></Field>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        {S.canais.map((c) => (
          <div key={c.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Badge c={c} size={30} />
              <input value={c.nome} onChange={(e) => setCanal(c.id, "nome", e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 700, color: "var(--tx)", fontFamily: "inherit", flex: 1, minWidth: 0 }} />
              <input type="color" value={c.cor} onChange={(e) => setCanal(c.id, "cor", e.target.value)} style={{ width: 28, height: 22, border: "1px solid var(--line)", padding: 0, background: "none", cursor: "pointer" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Field label="Comissão %"><Input value={c.com} onChange={(v) => setCanal(c.id, "com", v)} suffix="%" /></Field>
              <Field label="Afiliado %"><Input value={c.afi} onChange={(v) => setCanal(c.id, "afi", v)} suffix="%" /></Field>
              <Field label="Taxa fixa R$"><Input value={c.fix} onChange={(v) => setCanal(c.id, "fix", v)} prefix="R$" /></Field>
              <Field label="Frete absorvido R$"><Input value={c.frete} onChange={(v) => setCanal(c.id, "frete", v)} prefix="R$" /></Field>
            </div>
            <Field label="Logo (URL — link no seu GitHub)"><Input value={c.logo} onChange={(v) => setCanal(c.id, "logo", v)} /></Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrefsForm({ S, set }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", display: "grid", gap: 18, maxWidth: 440 }}>
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
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>D</div>
            <div style={{ lineHeight: 1.1 }}><div style={{ fontSize: 11.5, fontWeight: 700 }}>DBAESSE</div><div style={{ fontSize: 9.5, color: "var(--tx3)" }}>Premium</div></div>
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
      <div style={{ fontSize: 22, fontWeight: 700 }}>Olá, DBAESSE 👋</div>
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
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pur)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>D</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>DBAESSE</div><div style={{ fontSize: 10.5, color: "var(--tx3)" }}>Conta Premium</div></div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "clamp(20px,3vw,34px)", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div><div style={{ fontSize: 22, fontWeight: 700 }}>Olá, DBAESSE! 👋</div><div style={{ fontSize: 13.5, color: "var(--tx2)", marginTop: 2 }}>Veja o desempenho da sua simulação</div></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Seg options={[["branco", "Branco"], ["preto", "Preto"]]} val={S.tema} set={(v) => set("tema", v)} />
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
function MetricCard({ icon: Icon, label, value, sub, subColor }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
      <Icon size={18} color="var(--tx3)" />
      <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--tx3)", margin: "12px 0 8px" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || "var(--tx3)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}
function DeskDashboard({ S, d, setTab }) {
  const b = d.best;
  const [sel, setSel] = useState(null);
  const sr = d.rows.find((r) => r.c.id === sel) || b;
  const rows = [
    ["Preço de venda", pnum(S.preco), "var(--tx)"],
    ["Comissão da plataforma", -sr.comPlat, "var(--tx2)"],
    ["Comissão de afiliado", -sr.comAfi, "var(--tx2)"],
    ["Taxa fixa / transação", -sr.fix, "var(--tx2)"],
    ["Frete absorvido", -sr.frete, "var(--tx2)"],
    [`Imposto${S.regime === "CPF" ? " (isento)" : ""}`, -sr.impv, "var(--tx2)"],
    ["Total de taxas", -sr.taxas, "var(--red)", "tot"],
    ["Lucro líquido", sr.lucro, sr.lucro < 0 ? "var(--red)" : "var(--grn)", "luc"],
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14, marginBottom: 24 }}>
        <MetricCard icon={Lightbulb} label="Lucro médio" value={money(d.lucroMedio)} sub="por venda" />
        <MetricCard icon={Trophy} label="Melhor canal" value={b.c.nome} sub={`${b.margem.toFixed(1)}% de margem`} subColor="var(--grn)" />
        <MetricCard icon={BarChart3} label="Margem média" value={`${d.margemMedia.toFixed(1)}%`} sub="líquida" />
        <MetricCard icon={Tag} label="Preço sugerido" value={money(d.sugerido)} sub={`meta ${pnum(S.alvo)}%`} subColor="var(--amb)" />
        <MetricCard icon={ArrowLeftRight} label="Diferença entre canais" value={money(d.gap)} sub={`${b.c.nome} × ${d.worst.c.nome}`} subColor="var(--pur)" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Comparativo por marketplace</div>
        <button onClick={() => setTab("comparativo")} style={{ fontSize: 12.5, color: "var(--pur)", fontWeight: 600, background: "var(--purBg)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>Ver gráfico</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))", gap: 14, marginBottom: 26 }}>
        {d.rows.map((r) => {
          const top = r.c.id === b.c.id, on = top || r.c.id === sr.c.id;
          return (
            <div key={r.c.id} style={{ background: "var(--card)", borderRadius: 16, padding: "18px 16px", border: on ? "2px solid var(--pur)" : "1px solid var(--line)", position: "relative", textAlign: "center" }}>
              {top && <div style={{ position: "absolute", top: -10, right: 12, background: "var(--pur)", color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", padding: "3px 9px", borderRadius: 20 }}>TOP 1</div>}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Badge c={r.c} size={44} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>{r.c.nome}</div>
              <div style={{ fontSize: 10.5, color: "var(--tx3)", textAlign: "left" }}>Lucro líquido</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: r.lucro < 0 ? "var(--red)" : "var(--grn)", textAlign: "left" }}>{money(r.lucro)}</div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--line)", margin: "10px 0", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, r.margem))}%`, background: mcor(r.margem), borderRadius: 3 }} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: mcor(r.margem), textAlign: "left" }}>{r.margem.toFixed(1)}%</div>
              <button onClick={() => setSel(r.c.id)} style={{ width: "100%", marginTop: 12, padding: "7px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--line)", background: on ? "var(--purBg)" : "transparent", color: on ? "var(--pur)" : "var(--tx2)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}>Ver detalhes</button>
            </div>
          );
        })}
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px", maxWidth: 520 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {d.rows.map((r) => { const act = r.c.id === sr.c.id; return (
            <button key={r.c.id} onClick={() => setSel(r.c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, cursor: "pointer", border: act ? "1px solid var(--pur)" : "1px solid var(--line)", background: act ? "var(--purBg)" : "transparent", color: act ? "var(--pur)" : "var(--tx2)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c.cor }} />{r.c.nome}</button>
          ); })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Badge c={sr.c} size={30} /><div style={{ fontSize: 15, fontWeight: 700 }}>{sr.c.nome}</div>
          {sr.c.id === b.c.id && <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--grn)", background: "var(--grnBg)", padding: "3px 10px", borderRadius: 20 }}>Melhor resultado</div>}
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          {rows.map((x, i) => {
            const val = x[1] < 0 ? "− " + money(-x[1]) : money(x[1]);
            const strong = x[3] === "luc" ? 700 : x[3] === "tot" ? 600 : 400;
            const bt = (x[3] === "tot" || x[3] === "luc") ? { borderTop: "1px solid var(--line)", paddingTop: 9, marginTop: 1 } : {};
            return <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, ...bt }}><span style={{ color: "var(--tx2)" }}>{x[0]}</span><span style={{ color: x[2], fontWeight: strong }}>{val}</span></div>;
          })}
        </div>
      </div>
    </>
  );
}
function DeskComparativo({ d }) {
  const [modo, setModo] = useState("lucro");
  const data = d.ranking.map((r) => ({ id: r.c.id, nome: r.c.nome.split(" ")[0], cor: r.c.cor, lucro: +r.lucro.toFixed(2), margem: +r.margem.toFixed(1) }));
  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <ArrowLeftRight size={20} color="var(--pur)" />
        <div style={{ fontSize: 13.5, color: "var(--tx2)" }}>Vender no <b style={{ color: "var(--tx)" }}>{d.best.c.nome}</b> em vez do <b style={{ color: "var(--tx)" }}>{d.worst.c.nome}</b> rende</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: "var(--grn)" }}>+{money(d.gap)}</span><span style={{ fontSize: 12, color: "var(--tx3)" }}>por par</span></div>
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Comparação entre plataformas</div>
          <Seg options={[["lucro", "Lucro"], ["margem", "Margem"]]} val={modo} set={setModo} />
        </div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 6, right: 20, top: 2, bottom: 2 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="nome" width={92} tick={{ fontSize: 12, fill: "var(--tx2)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--soft)" }} formatter={(v) => (modo === "lucro" ? money(v) : v + "%")} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)" }} />
              <Bar dataKey={modo} radius={[0, 6, 6, 0]}>{data.map((e) => <Cell key={e.id} fill={e.id === d.best.c.id ? "var(--pur)" : e.cor} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Ranking por lucro líquido</div>
        <div style={{ display: "grid", gap: 4 }}>
          {d.ranking.map((r, i) => (
            <div key={r.c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < d.ranking.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ width: 20, fontSize: 13, fontWeight: 700, color: i === 0 ? "var(--pur)" : "var(--tx3)" }}>{i + 1}</div>
              <Badge c={r.c} size={30} /><div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{r.c.nome}</div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: r.lucro < 0 ? "var(--red)" : "var(--grn)" }}>{money(r.lucro)}</div><div style={{ fontSize: 11.5, color: mcor(r.margem), fontWeight: 600 }}>{r.margem.toFixed(1)}%</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
