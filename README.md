# Stotra (local development)

Quick notes for running the project locally (frontend + backend) and testing signup/login/buy/sell behavior.

Required environment variables

- `STOTRA_JWT_SECRET` (required): secret key to sign JWT tokens used by the backend.
- `STOTRA_TURNSTILE_SECRET` (optional): Cloudflare Turnstile secret for signup validation.
- `MONGO_URI` (optional): MongoDB connection string. Defaults to `mongodb://localhost:27017/`.
- `ML_SERVICE_URL` (optional): URL for the ML prediction service. Defaults to `http://localhost:5001`.

See `.env.example` for a small template.

## Running the Project

### 1. Run ML Prediction Service (Python, separate terminal)

```powershell
Set-Location -Path 'D:\stellix\ml-service'
pip install -r requirements.txt
python app.py
```

Service will start on `http://localhost:5001`

### 2. Run backend (PowerShell, separate terminal)

```powershell
Set-Location -Path 'D:\stellix\server'
# Set a dev JWT secret (choose a secure value for production)
$env:STOTRA_JWT_SECRET = 'devsecret'
npm install
npm run dev
```

### 3. Run frontend (PowerShell, separate terminal)

```powershell
Set-Location -Path 'D:\stellix\app'
npm install
npm run dev
```

## Features

- **Stock Trading**: Buy and sell stocks with real-time prices from Yahoo Finance
- **Portfolio Management**: Track positions, cash, and portfolio value
- **Watchlist**: Save stocks for quick access
- **Leaderboard**: Compete with other traders
- **AI Price Predictions**: LSTM + XGBoost hybrid model predicts next-day and next-week stock prices
- **News Feed**: Latest news for stocks and markets

## Testing the API (PowerShell examples)

1. Signup

```powershell
Invoke-RestMethod -Uri 'http://localhost:3010/api/auth/signup' -Method POST -ContentType 'application/json' -Body (@{ username='alice'; password='secret123' } | ConvertTo-Json)
```

2. Login (get token)

```powershell
$login = Invoke-RestMethod -Uri 'http://localhost:3010/api/auth/login' -Method POST -ContentType 'application/json' -Body (@{ username='alice'; password='secret123' } | ConvertTo-Json)
$token = $login.accessToken
```

3. Buy stock

```powershell
Invoke-RestMethod -Uri 'http://localhost:3010/api/stocks/AAPL/buy' -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body (@{ quantity = 1 } | ConvertTo-Json)
```

4. Sell stock

```powershell
Invoke-RestMethod -Uri 'http://localhost:3010/api/stocks/AAPL/sell' -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body (@{ quantity = 1 } | ConvertTo-Json)
```

Debug helper endpoint (development only)

- A debugging endpoint is available at `GET /api/debug/user/:username` which returns the raw user document from MongoDB. This is intended for local development only and should not be exposed in production.
