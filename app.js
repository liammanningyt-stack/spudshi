const state = {
  accounts: JSON.parse(localStorage.getItem("rhs_accounts") || "[]"),
  markets: JSON.parse(localStorage.getItem("rhs_markets") || "[]"),
  ledger: JSON.parse(localStorage.getItem("rhs_ledger") || "[]"),
};

const accountForm = document.getElementById("account-form");
const marketForm = document.getElementById("market-form");
const accountList = document.getElementById("account-list");
const marketsEl = document.getElementById("markets");
const ledgerEl = document.getElementById("ledger");

function save() {
  localStorage.setItem("rhs_accounts", JSON.stringify(state.accounts));
  localStorage.setItem("rhs_markets", JSON.stringify(state.markets));
  localStorage.setItem("rhs_ledger", JSON.stringify(state.ledger));
}

function fmtMoney(v) {
  return `$${v.toLocaleString()} fake`;
}

function addLedger(entry) {
  state.ledger.unshift(`${new Date().toLocaleString()} — ${entry}`);
  state.ledger = state.ledger.slice(0, 50);
}

function renderAccounts() {
  if (!state.accounts.length) {
    accountList.innerHTML = "<p>No accounts yet.</p>";
    return;
  }

  accountList.innerHTML = `
    <h3>Accounts</h3>
    <ul>
      ${state.accounts
        .map(
          (a) =>
            `<li><strong>${a.name}</strong> — Balance: ${fmtMoney(a.balance)} | YES shares: ${a.yes} | NO shares: ${a.no}</li>`,
        )
        .join("")}
    </ul>
  `;
}

function marketTemplate(m) {
  const accountOptions = state.accounts
    .map((a) => `<option value="${a.id}">${a.name} (${fmtMoney(a.balance)})</option>`)
    .join("");

  return `
    <article class="market" data-market-id="${m.id}">
      <h3>${m.question}</h3>
      <p class="meta">Category: ${m.category || "General"} • Expires: ${m.expiry}</p>
      <p class="meta">Volume: YES ${m.yesVolume} / NO ${m.noVolume}</p>
      <div class="trade-grid">
        <select class="account-select">${accountOptions}</select>
        <input class="qty-input" type="number" min="1" value="1" />
        <button class="buy-yes">Buy YES</button>
        <button class="buy-no">Buy NO</button>
      </div>
    </article>
  `;
}

function renderMarkets() {
  if (!state.markets.length) {
    marketsEl.innerHTML = "<p>No markets yet. Create one above.</p>";
    return;
  }

  if (!state.accounts.length) {
    marketsEl.innerHTML = "<p>Create at least one account before placing trades.</p>";
    return;
  }

  marketsEl.innerHTML = state.markets.map(marketTemplate).join("");

  marketsEl.querySelectorAll(".market").forEach((marketNode) => {
    const marketId = marketNode.getAttribute("data-market-id");
    const yesBtn = marketNode.querySelector(".buy-yes");
    const noBtn = marketNode.querySelector(".buy-no");

    function trade(side) {
      const acctId = marketNode.querySelector(".account-select").value;
      const qty = Number(marketNode.querySelector(".qty-input").value);
      if (!Number.isFinite(qty) || qty < 1) {
        alert("Quantity must be at least 1.");
        return;
      }

      const account = state.accounts.find((a) => a.id === acctId);
      const market = state.markets.find((m) => m.id === marketId);
      const cost = qty;

      if (!account || !market) return;
      if (account.balance < cost) {
        alert("Insufficient fake balance.");
        return;
      }

      account.balance -= cost;
      if (side === "YES") {
        account.yes += qty;
        market.yesVolume += qty;
      } else {
        account.no += qty;
        market.noVolume += qty;
      }

      addLedger(`${account.name} bought ${qty} ${side} share(s) in "${market.question}" for ${fmtMoney(cost)}.`);
      save();
      renderAll();
    }

    yesBtn.addEventListener("click", () => trade("YES"));
    noBtn.addEventListener("click", () => trade("NO"));
  });
}

function renderLedger() {
  ledgerEl.innerHTML = state.ledger.map((item) => `<li>${item}</li>`).join("") || "<li>No activity yet.</li>";
}

function renderAll() {
  renderAccounts();
  renderMarkets();
  renderLedger();
}

accountForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const startingBalance = Number(document.getElementById("starting-balance").value);

  if (!name) return;
  if (!Number.isFinite(startingBalance) || startingBalance < 1) {
    alert("Starting fake balance must be at least 1.");
    return;
  }

  state.accounts.push({
    id: crypto.randomUUID(),
    name,
    balance: Math.floor(startingBalance),
    yes: 0,
    no: 0,
  });

  addLedger(`Account created for ${name} with ${fmtMoney(Math.floor(startingBalance))}.`);
  accountForm.reset();
  document.getElementById("starting-balance").value = "1000";
  save();
  renderAll();
});

marketForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const question = document.getElementById("question").value.trim();
  const category = document.getElementById("category").value.trim();
  const expiry = document.getElementById("expiry").value;

  if (!question || !expiry) return;

  state.markets.unshift({
    id: crypto.randomUUID(),
    question,
    category,
    expiry,
    yesVolume: 0,
    noVolume: 0,
  });

  addLedger(`Market created: "${question}" (${category || "General"}).`);
  marketForm.reset();
  save();
  renderAll();
});

renderAll();
