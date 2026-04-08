# Stock Price Prediction Service (LSTM + XGBoost)

Python microservice for predicting stock prices using a hybrid LSTM+XGBoost model.

## Architecture

- **LSTM**: Captures sequential patterns in historical price data
- **XGBoost**: Final prediction using LSTM features + technical indicators (MA, RSI, MACD, Bollinger Bands)

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Service will start on `http://0.0.0.0:5001`

## API Endpoints

### Predict Single Stock

```bash
POST /predict
Content-Type: application/json

{
  "symbol": "AAPL"
}
```

Response:

```json
{
	"symbol": "AAPL",
	"current_price": 175.43,
	"next_day": {
		"predicted_price": 176.21,
		"change": 0.78,
		"change_percent": 0.44
	},
	"next_week": {
		"predicted_price": 178.5,
		"change": 3.07,
		"change_percent": 1.75
	},
	"confidence": "medium",
	"timestamp": "2025-11-18T16:30:00"
}
```

### Predict Multiple Stocks

```bash
POST /predict/batch
Content-Type: application/json

{
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

### Health Check

```bash
GET /health
```

## Notes

- First prediction for a symbol trains the model (takes ~30-60 seconds)
- Subsequent predictions for the same symbol are cached and faster
- Models are trained on 2 years of historical data
- In production, implement model persistence and regular retraining
