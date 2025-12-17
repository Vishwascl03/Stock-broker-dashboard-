const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

const wss = new WebSocket.Server({ server });

const STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

// Generate random stock prices
function generatePrices() {
  const prices = {};
  STOCKS.forEach(stock => {
    prices[stock] = (Math.random() * 1000 + 100).toFixed(2);
  });
  return prices;
}

wss.on("connection", ws => {
  ws.subscribedStocks = [];

  ws.on("message", message => {
    const data = JSON.parse(message);

    if (data.type === "SUBSCRIBE") {
      ws.subscribedStocks = data.stocks;
    }
  });
});

// Broadcast prices every second
setInterval(() => {
  const prices = generatePrices();

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const filteredPrices = {};
      client.subscribedStocks.forEach(stock => {
        filteredPrices[stock] = prices[stock];
      });

      client.send(JSON.stringify({
        type: "PRICE_UPDATE",
        prices: filteredPrices
      }));
    }
  });
}, 1000);
