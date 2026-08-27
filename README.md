# Clickmargem

App de margem e lucro por marketplace da DBAESSE. Simula custo + preço e mostra,
em cada canal, o lucro líquido e a margem — já descontando comissão, afiliado,
taxa fixa, frete e imposto. Responsivo: layout de celular e de computador.

## Subir no Vercel (igual aos catálogos)

1. **Crie um repositório novo** no GitHub (ex.: `margin-pro`).
2. **Suba estes arquivos** para o repositório (todos, menos `node_modules`).
3. No **Vercel**, clique em *Add New > Project*, importe o repositório.
   - Framework: **Vite** (o Vercel detecta sozinho).
   - Build Command: `npm run build`  ·  Output: `dist`
4. Clique em **Deploy**. Pronto — o app fica no ar num link `.vercel.app`.

## Logos oficiais

Coloque os arquivos em `public/logos/` com os nomes indicados no
`public/logos/LEIA-ME.txt`. Aparecem sozinhos no app. Sem eles, o app
mostra a inicial do canal com a cor da marca (nada quebra).

## Rodar localmente (opcional)

```
npm install
npm run dev
```

## Trocar o nome do app

O nome "Clickmargem" aparece em dois lugares: `index.html` (título da aba)
e no `src/App.jsx` (logo da sidebar / topo). Troque nos dois e pronto.
