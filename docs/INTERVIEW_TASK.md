# Frontend Developer - Technical Assessment

## Process

This task is designed to reflect the kind of real world work.

| | |
|---|---|
| **Tools** | Internet, documentation, and AI tools are all allowed |
| **Delivery** | Create a public GitHub repository and share the link with us |
| **Review** | We'll walk through your code together in the interview |

---

## The Task

Build a **Crypto Market Dashboard** that fetches live cryptocurrency data and presents it in a clean, responsive layout.

### API

Use the free CoinGecko API:

```
GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false
```

Docs: https://docs.coingecko.com/reference/coins-markets

---

### Requirements

1. **Data fetching** - Fetch the top 20 cryptocurrencies by market cap with proper caching and error handling.

2. **Responsive card grid** - Display each coin in a card layout: 1 column on mobile, 2 on tablet, 3-4 on desktop.

3. **Card content** - Each card shows: coin icon, name, symbol, current price in USD (formatted), and 24h price change percentage (green for positive, red for negative).

4. **Search** - A text input that filters coins by name or symbol.

5. **Sort** - Allow sorting by price or 24h change (ascending/descending).

6. **Edge cases** - Loading state, API error with retry, empty search results, network failure recovery.

---

### Bonus

- Pagination or infinite scroll
- Coin detail page with price chart
- Dark/light theme toggle
- Tests

---

## Evaluation Criteria

| Area | What we look for |
|---|---|
| **Code structure** | File organization, separation of concerns, reusable components |
| **TypeScript** | Proper typing, interfaces for API responses |
| **Data fetching** | Caching strategy, error/loading states, retry logic |
| **Responsive design** | Works across breakpoints |
| **Edge cases** | Loading skeletons, error recovery, empty states |
| **Git history** | Clean, logical commits |
| **Code quality** | Readable code, meaningful naming |

---

## Submission

1. Push your work to a public GitHub repository
2. Include a README with setup instructions so we can run it locally
3. Share the repository link with us

Be prepared to explain your decisions, tradeoffs, and what you'd improve with more time.
Good luck, and have fun!