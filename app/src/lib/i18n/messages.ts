/** English is the source of truth; Portuguese must provide every key. */
export const en = {
  "nav.explore": "Explore",
  "nav.create": "Start a group order",
  "nav.orders": "My orders",
  "nav.menuOpen": "Open menu",
  "nav.menuClose": "Close menu",
  "nav.language": "Language",

  "hero.title": "Group buys, without the trust fall.",
  "hero.body": "Pool money with people you follow. The organizer only gets paid as the goods arrive. Enforced on Solana.",
  "hero.explore": "Explore open orders",
  "hero.create": "Start a group order",
  "hero.sampleNote": "Example order. Real ones live under Explore.",

  "problem.title": "Fandom runs on group orders. Group orders run on hope.",
  "problem.p1":
    "One organizer collects Pix from hundreds of strangers, orders abroad, and reships weeks later. When it works, everyone saves. When it does not, the money is simply gone.",
  "problem.p2":
    "Pix is instant and irreversible, and buyer protection does not cover a transfer to a person. Honest organizers pay for it too: every new order starts from zero trust.",
  "problem.stat1":
    "collected by one organizer for BTS light sticks in Bahia before vanishing, September 2026. About 1,000 fans.",
  "problem.stat2": "fans in Lima paid for Army Bombs across three pre-orders that never shipped, October 2026.",
  "problem.stat3":
    "of money contested as Pix fraud is actually returned to victims through the official dispute mechanism (MED), per Banco Central data.",
  "problem.stat4": "Brazil's rank among K-pop streaming markets worldwide. Mexico is 6th.",

  "how.title": "Money moves only when the order does.",
  "how.sub": "Four steps, each one enforced by the program, not by promises.",
  "how.s1.title": "Buyers join and pay into a vault",
  "how.s1.body":
    "Each payment goes to an on-chain escrow account for that order, never to the organizer's wallet. Leave anytime before the deadline for a full refund.",
  "how.s2.title": "Minimum met, the order locks",
  "how.s2.body":
    "The organizer receives a capped advance to place the bulk order. The cap is set when the order is created and shown before anyone pays.",
  "how.s3.title": "Shipped with proof",
  "how.s3.body":
    "The organizer adds a tracking reference. If they never ship within the window, every buyer reclaims the held share with one click.",
  "how.s4.title": "Confirm, and the rest releases",
  "how.s4.body":
    "Each buyer confirms receipt and their remaining share pays out. Did not arrive? Open a dispute and a neutral arbiter decides.",
  "how.link": "Read the full safety rules",

  "sides.buyers": "For buyers",
  "sides.b1": "Your maximum exposure is the organizer advance, and you see it before you pay.",
  "sides.b2": "Refunds are a button, not a WhatsApp argument. If the order fails, the program pays you back.",
  "sides.b3": "Every organizer's history is on-chain. Completed orders and disputes lost cannot be edited.",
  "sides.browse": "Browse open orders",
  "sides.organizers": "For organizers",
  "sides.o1": "Collect without chasing receipts. Share one link; it works as a pay button inside X and wallets.",
  "sides.o2": "Get working capital the moment the minimum is met, then the rest as items land.",
  "sides.o3": "Build a track record you own. Your reputation travels with your wallet, not with a platform.",
  "sides.create": "Start a group order",

  "why.title": "Why this needs Solana, not a spreadsheet.",
  "why.p1.title": "Fees under a cent",
  "why.p1.body": "Per-buyer settlement on R$ 40 items only works when a transaction costs less than a text message.",
  "why.p2.title": "Final in seconds",
  "why.p2.body": "Buyers who grew up on Pix expect instant. Refunds and payouts land before the toast disappears.",
  "why.p3.title": "Links that pay",
  "why.p3.body": "Every order is a Blink. Paste it in a thread or a Discord and it renders as a join button.",
  "why.p4.title": "Reputation you own",
  "why.p4.body": "Order history lives in program accounts. Any app can read it, and nobody can quietly delete it.",

  "cta.title": "The next group order you join should not require faith.",
  "cta.body": "Open on Solana devnet today. Test USDC is free.",
  "cta.explore": "Explore open orders",
  "cta.create": "Start a group order",

  "footer.about":
    "Escrow for group orders. Money stays in a Solana vault until the goods arrive, and every finished order becomes the organizer's track record.",
  "footer.product": "Product",
  "footer.exploreOrders": "Explore orders",
  "footer.create": "Start a group order",
  "footer.orders": "My orders",
  "footer.how": "How it works",
  "footer.protocol": "Protocol",
  "footer.program": "Program on Solana Explorer",
  "footer.source": "Source code",
  "footer.safety": "Safety rules",
  "footer.legal": "Pacto is non-custodial software. Funds are held by an on-chain program, not by Pacto.",
  "footer.built": "Built on Solana",
} as const;

export type MessageKey = keyof typeof en;

export const pt: Record<MessageKey, string> = {
  "nav.explore": "Explorar",
  "nav.create": "Criar compra em grupo",
  "nav.orders": "Meus pedidos",
  "nav.menuOpen": "Abrir menu",
  "nav.menuClose": "Fechar menu",
  "nav.language": "Idioma",

  "hero.title": "Compra em grupo, sem precisar de fé.",
  "hero.body":
    "Junte dinheiro com quem você segue. O organizador só recebe conforme os produtos chegam. Garantido na Solana.",
  "hero.explore": "Ver pedidos abertos",
  "hero.create": "Criar compra em grupo",
  "hero.sampleNote": "Pedido de exemplo. Os reais ficam em Explorar.",

  "problem.title": "O fandom vive de compras em grupo. As compras em grupo vivem de esperança.",
  "problem.p1":
    "Um organizador recebe Pix de centenas de desconhecidos, compra no exterior e reenvia semanas depois. Quando dá certo, todo mundo economiza. Quando não dá, o dinheiro simplesmente some.",
  "problem.p2":
    "O Pix é instantâneo e irreversível, e a proteção ao comprador não cobre transferência para uma pessoa. Organizadores honestos também pagam o preço: todo pedido novo começa do zero em confiança.",
  "problem.stat1":
    "arrecadados por uma organizadora de light sticks do BTS na Bahia antes de sumir, em setembro de 2026. Cerca de 1.000 fãs.",
  "problem.stat2":
    "fãs em Lima pagaram por Army Bombs em três pré-vendas que nunca foram enviadas, em outubro de 2026.",
  "problem.stat3":
    "do dinheiro contestado como fraude de Pix é realmente devolvido às vítimas pelo mecanismo oficial de devolução (MED), segundo dados do Banco Central.",
  "problem.stat4": "posição do Brasil entre os mercados de streaming de K-pop no mundo. O México é o 6º.",

  "how.title": "O dinheiro só se move quando o pedido avança.",
  "how.sub": "Quatro etapas, cada uma garantida pelo programa, não por promessas.",
  "how.s1.title": "Compradores entram e pagam em um cofre",
  "how.s1.body":
    "Cada pagamento vai para uma conta de custódia na blockchain, nunca para a carteira do organizador. Saia a qualquer momento antes do prazo e receba tudo de volta.",
  "how.s2.title": "Mínimo atingido, o pedido trava",
  "how.s2.body":
    "O organizador recebe um adiantamento limitado para fazer a compra em lote. O limite é definido na criação e aparece antes de qualquer pagamento.",
  "how.s3.title": "Enviado, com comprovação",
  "how.s3.body":
    "O organizador informa o código de rastreio. Se ele não enviar dentro do prazo, cada comprador recupera o valor retido com um clique.",
  "how.s4.title": "Confirme, e o restante é liberado",
  "how.s4.body":
    "Cada comprador confirma o recebimento e a parte restante é paga. Não chegou? Abra uma disputa e um árbitro neutro decide.",
  "how.link": "Leia as regras de segurança completas",

  "sides.buyers": "Para compradores",
  "sides.b1": "Sua exposição máxima é o adiantamento do organizador, e você vê esse valor antes de pagar.",
  "sides.b2":
    "Reembolso é um botão, não uma discussão no WhatsApp. Se o pedido falhar, o programa devolve o seu dinheiro.",
  "sides.b3":
    "O histórico de cada organizador fica na blockchain. Pedidos concluídos e disputas perdidas não podem ser editados.",
  "sides.browse": "Ver pedidos abertos",
  "sides.organizers": "Para organizadores",
  "sides.o1":
    "Receba sem correr atrás de comprovantes. Compartilhe um link; ele funciona como botão de pagamento no X e nas carteiras.",
  "sides.o2": "Tenha capital de giro assim que o mínimo for atingido, e o restante conforme os itens chegam.",
  "sides.o3": "Construa um histórico que é seu. Sua reputação vai com a sua carteira, não com uma plataforma.",
  "sides.create": "Criar compra em grupo",

  "why.title": "Por que isso precisa da Solana, e não de uma planilha.",
  "why.p1.title": "Taxas abaixo de um centavo",
  "why.p1.body":
    "Liquidar cada comprador em itens de R$ 40 só funciona quando uma transação custa menos que uma mensagem de texto.",
  "why.p2.title": "Final em segundos",
  "why.p2.body":
    "Quem cresceu com o Pix espera instantaneidade. Reembolsos e pagamentos chegam antes de o aviso sumir da tela.",
  "why.p3.title": "Links que pagam",
  "why.p3.body":
    "Todo pedido é um Blink. Cole em uma thread ou no Discord e ele aparece como um botão de entrar.",
  "why.p4.title": "Reputação que é sua",
  "why.p4.body":
    "O histórico de pedidos fica em contas do programa. Qualquer app pode ler, e ninguém consegue apagar em silêncio.",

  "cta.title": "A próxima compra em grupo da qual você participar não deveria exigir fé.",
  "cta.body": "Aberto hoje na devnet da Solana. USDC de teste é grátis.",
  "cta.explore": "Ver pedidos abertos",
  "cta.create": "Criar compra em grupo",

  "footer.about":
    "Custódia para compras em grupo. O dinheiro fica em um cofre na Solana até os produtos chegarem, e cada pedido concluído vira o histórico do organizador.",
  "footer.product": "Produto",
  "footer.exploreOrders": "Explorar pedidos",
  "footer.create": "Criar compra em grupo",
  "footer.orders": "Meus pedidos",
  "footer.how": "Como funciona",
  "footer.protocol": "Protocolo",
  "footer.program": "Programa no Solana Explorer",
  "footer.source": "Código-fonte",
  "footer.safety": "Regras de segurança",
  "footer.legal":
    "A Pacto é um software não custodial. Os fundos ficam em um programa na blockchain, não com a Pacto.",
  "footer.built": "Construído na Solana",
};

export type Locale = "en" | "pt";
export const LOCALES: Locale[] = ["en", "pt"];
export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, pt };
