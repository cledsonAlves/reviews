import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy endpoint with mock data
  app.get("/api/proxy/reviews", async (req, res) => {
    const mockReviews = [
      {
          "app_id": "com.itau.investimentos",
          "content": "O aplicativo não funciona! Pede instalação de um token, porem o token já existe e funciona perfeitamente em minha conta bancária.",
          "date": "Wed, 11 Mar 2026 09:32:49 GMT",
          "rating": 1,
          "reply_content": null,
          "reply_date": null,
          "review_id": "58ab6993-e37f-4d6d-b078-34f2e4e60168",
          "thumbs_up": 0,
          "user_name": "Geovani Nascimento Pinho Filho"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "Péssimo app, demora para atualizar as cotações, cai toda hora, vive com instabilidade e erros no acesso, já reportei várias vezes o problema e nada muda, se não quiser ter prejuízo não usa o app.",
          "date": "Tue, 10 Mar 2026 17:25:35 GMT",
          "rating": 1,
          "reply_content": null,
          "reply_date": null,
          "review_id": "bc8a8f7b-ed5e-4a34-8a62-baa443f237b1",
          "thumbs_up": 0,
          "user_name": "Hugo Rizzo"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "O aplicativo fluido, leve e com excelente aparência, um convite para explorar o universo investimentos. A única ressalva que deixo é sobre a conta corretora, pois entendo que poderia haver no próprio aplicativo uma forma de solicitar os resgates para a conta corrente. Não tendo quem opta por usar separado precisa entrar no site Itaú corretora para realizar as solicitações de resgate para conta corrente, achei a princípio confuso, hoje que já tenho a prática vejo como um processo moroso.",
          "date": "Tue, 10 Mar 2026 17:08:56 GMT",
          "rating": 5,
          "reply_content": null,
          "reply_date": null,
          "review_id": "8fb7d105-8d2b-44e5-9197-f52b0efb90f7",
          "thumbs_up": 0,
          "user_name": "Moises Bastos"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "tem apresentado instabilidade constante...ainda mais quando é preciso acessar com urgência",
          "date": "Tue, 10 Mar 2026 15:28:47 GMT",
          "rating": 2,
          "reply_content": null,
          "reply_date": null,
          "review_id": "0c397451-ae0d-4b74-92b4-dccc24aa0b01",
          "thumbs_up": 0,
          "user_name": "Virgilio Salomão"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "aplicativo instável, fecha do nada.",
          "date": "Tue, 10 Mar 2026 13:51:42 GMT",
          "rating": 3,
          "reply_content": null,
          "reply_date": null,
          "review_id": "cef7b31e-8d0a-48cf-8465-3451b41191c7",
          "thumbs_up": 0,
          "user_name": "Thays Brito"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "muita instabilidade desloga o tempo todo, não apresenta os resultados de pesquisa e quando apresenta sai do aplicativo.",
          "date": "Tue, 10 Mar 2026 12:44:19 GMT",
          "rating": 2,
          "reply_content": "Olá, Carlos! Que bom receber seu comentário. Sua opinião é muito valiosa. Nossa equipe está sempre disponível para ajudar. Para um funcionamento ainda melhor, recomendamos limpar o cache do aplicativo e reiniciar seu dispositivo. Estamos aqui para auxiliar. íon Itaú: todos os seus investimentos num só lugar",
          "reply_date": "Wed, 11 Mar 2026 15:35:05 GMT",
          "review_id": "a384044f-3351-490e-9c40-4841df32426f",
          "thumbs_up": 0,
          "user_name": "Carlos Ao"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "Mesmo depois da atualização, na area de pesquisa do ativo, após filtrar e clicar nele para comprar o App fecha sozinho",
          "date": "Tue, 10 Mar 2026 11:04:31 GMT",
          "rating": 1,
          "reply_content": null,
          "reply_date": null,
          "review_id": "cc2f9c18-6361-4592-af89-47a6369407d8",
          "thumbs_up": 0,
          "user_name": "Vagner Galvao"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "Aplicativo bem intuitivo, gostaria apenas que pudesse instalar o app em aparelho diferente do que fica o app do banco.",
          "date": "Tue, 10 Mar 2026 00:04:58 GMT",
          "rating": 3,
          "reply_content": "Olá, Wallace! Agradecemos seu comentário. Para que possamos entender melhor a situação e te ajudar, entre em contato pelo app Íon. Acesse o menu principal, vá em “Ajuda” e envie seu relato por lá. Estamos à disposição para apoiar no que precisar. íon Itaú: todos os seus investimentos num só lugar",
          "reply_date": "Wed, 11 Mar 2026 11:25:07 GMT",
          "review_id": "68184bd5-0c8b-490b-88fd-38f6c780bb24",
          "thumbs_up": 0,
          "user_name": "Wallace Paraense"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "Aplicativo muito instável, deixa a desejar.",
          "date": "Mon, 09 Mar 2026 22:57:53 GMT",
          "rating": 3,
          "reply_content": "Olá, Guilherme! Valorizamos sua opinião. Conte conosco sempre que precisar para otimizarmos sua experiência com o app Íon. Recomendamos atualizar o app e realizar uma limpeza de cache para melhorar a estabilidade. íon Itaú: todos os seus investimentos num só lugar",
          "reply_date": "Wed, 11 Mar 2026 11:25:42 GMT",
          "review_id": "6b12794f-fd4f-47d3-a77e-dbcd2b20fed0",
          "thumbs_up": 0,
          "user_name": "Guilherme Simões"
      },
      {
          "app_id": "com.itau.investimentos",
          "content": "SAUDADES do antigo APP Itaú corretora. 😞 O Banco Itaú deveria se sentir envergonhado em oferecer um APP medíocre como esse para seus clientes. Nao Recomendo nem para o meu pior Inimigo. Péssimo login, inúmeras tentativas para entrar, lento, sempre travando, sai sozinho, péssimo, péssimo.... Pretendo encontrar outra corretora em breve. O q ainda me segura aqui é o Banco Itaú, q confio.",
          "date": "Mon, 09 Mar 2026 14:58:44 GMT",
          "rating": 1,
          "reply_content": "Olá! Obrigado por se comunicar conosco e enviar seu feedback. Nossa equipe está totalmente voltada para o aperfeiçoamento dos processos e da entrega final. Queremos assegurar que você sempre encontre em nós a qualidade e a atenção necessárias. Conte sempre conosco! íon Itaú: todos os seus investimentos num só lugar",
          "reply_date": "Wed, 11 Mar 2026 19:05:56 GMT",
          "review_id": "5eabe895-da40-445e-ad78-33b60371cabb",
          "thumbs_up": 66,
          "user_name": "RL RL"
      }
    ];
    res.json({ reviews: mockReviews });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
