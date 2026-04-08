"""
Flask API service for stock price prediction
Endpoints:
- POST /predict - Predict stock prices for next day and week
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import StockPredictor
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache for predictors (in production, use Redis or similar)
predictor_cache = {}

def get_predictor(symbol):
    """Get or create predictor for symbol"""
    if symbol not in predictor_cache:
        predictor_cache[symbol] = StockPredictor()
    return predictor_cache[symbol]

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'stock-prediction'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict stock prices
    Request body: { "symbol": "AAPL" }
    """
    try:
        data = request.get_json()
        
        if not data or 'symbol' not in data:
            return jsonify({'error': 'Missing symbol parameter'}), 400
        
        symbol = data['symbol'].upper()
        logger.info(f"Prediction request for {symbol}")
        
        # Get predictor and make prediction
        predictor = get_predictor(symbol)
        result = predictor.predict_next_day_and_week(symbol)
        
        logger.info(f"Prediction complete for {symbol}")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict multiple stocks
    Request body: { "symbols": ["AAPL", "GOOGL", "MSFT"] }
    """
    try:
        data = request.get_json()
        
        if not data or 'symbols' not in data:
            return jsonify({'error': 'Missing symbols parameter'}), 400
        
        symbols = [s.upper() for s in data['symbols']]
        results = []
        
        for symbol in symbols:
            try:
                predictor = get_predictor(symbol)
                result = predictor.predict_next_day_and_week(symbol)
                results.append(result)
            except Exception as e:
                logger.error(f"Error predicting {symbol}: {str(e)}")
                results.append({
                    'symbol': symbol,
                    'error': str(e)
                })
        
        return jsonify({'predictions': results}), 200
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
