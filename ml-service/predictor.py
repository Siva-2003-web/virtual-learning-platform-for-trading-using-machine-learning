"""
LSTM + XGBoost Hybrid Stock Price Prediction Service

Architecture:
1. Fetch historical stock data (yfinance with fallback to backend API)
2. Feature engineering: technical indicators (moving averages, RSI, etc.)
3. LSTM for sequential pattern extraction
4. XGBoost for final price prediction using LSTM features + technical features
5. Return next-day and next-week predictions
"""

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import xgboost as xgb
from tensorflow import keras
from tensorflow.keras import layers
import joblib
import os
import requests
from datetime import datetime, timedelta

class StockPredictor:
    def __init__(self, backend_url="http://localhost:3010"):
        self.lstm_lookback = 60  # 60 days of history for LSTM
        self.scaler_price = MinMaxScaler(feature_range=(0, 1))
        self.scaler_features = MinMaxScaler(feature_range=(0, 1))
        self.lstm_model = None
        self.xgb_model = None
        self.backend_url = backend_url
        
    def fetch_data_from_backend(self, symbol):
        """Fetch data from backend API as fallback"""
        try:
            # Use backend's historical endpoint which already works
            response = requests.get(
                f"{self.backend_url}/api/stocks/{symbol}/historical",
                params={"period": "2y"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Backend returns array of [timestamp, close_price] pairs
                timestamps = []
                closes = []
                
                # Current time in milliseconds
                now_ms = datetime.now().timestamp() * 1000
                
                for item in data:
                    if isinstance(item, list) and len(item) >= 2:
                        ts = item[0]
                        price = item[1]
                        
                        # Only include past data (not future timestamps)
                        if ts <= now_ms and price > 0:
                            timestamps.append(ts)
                            closes.append(price)
                
                if not timestamps or len(timestamps) < 100:
                    print(f"Insufficient valid data: {len(timestamps)} points")
                    return None
                
                # Convert to DataFrame matching yfinance format
                df = pd.DataFrame({
                    'Close': closes,
                    'Open': closes,  # Use close as approximation
                    'High': closes,
                    'Low': closes,
                    'Volume': [1000000] * len(closes)  # Default volume
                })
                
                # Convert timestamps to datetime index
                df.index = pd.to_datetime(timestamps, unit='ms')
                df.index.name = 'Date'
                
                # Sort by date and remove duplicates
                df = df.sort_index()
                df = df[~df.index.duplicated(keep='first')]
                
                print(f"Parsed {len(df)} valid data points from {df.index.min()} to {df.index.max()}")
                
                return df
            else:
                return None
        except Exception as e:
            print(f"Backend fetch error: {str(e)}")
            return None
        
    def fetch_data(self, symbol, period='2y'):
        """Fetch historical stock data"""
        import time
        
        # Try backend first (more reliable)
        print(f"Fetching data for {symbol} from backend...")
        df = self.fetch_data_from_backend(symbol)
        
        if df is not None and not df.empty:
            print(f"Successfully fetched {len(df)} days of data from backend")
            return df
        
        # Fallback to yfinance with retry logic
        print(f"Backend failed, trying yfinance...")
        max_retries = 3
        for attempt in range(max_retries):
            try:
                stock = yf.Ticker(symbol)
                # Add headers to avoid rate limiting
                df = stock.history(period=period)
                
                if df.empty:
                    if attempt < max_retries - 1:
                        time.sleep(2)  # Wait before retry
                        continue
                    raise ValueError(f"No data found for {symbol}")
                return df
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Retry {attempt + 1}/{max_retries} for {symbol}")
                    time.sleep(2)
                    continue
                raise Exception(f"Error fetching data for {symbol}: {str(e)}")
    
    def engineer_features(self, df):
        """Create technical indicators and features"""
        df = df.copy()
        
        # Moving averages
        df['MA_5'] = df['Close'].rolling(window=5).mean()
        df['MA_20'] = df['Close'].rolling(window=20).mean()
        df['MA_50'] = df['Close'].rolling(window=50).mean()
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # Bollinger Bands
        df['BB_middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_upper'] = df['BB_middle'] + (bb_std * 2)
        df['BB_lower'] = df['BB_middle'] - (bb_std * 2)
        
        # Volume change
        df['Volume_change'] = df['Volume'].pct_change()
        
        # Price change
        df['Price_change'] = df['Close'].pct_change()
        
        # Drop NaN values
        df = df.dropna()
        
        return df
    
    def prepare_lstm_data(self, data, lookback=60):
        """Prepare sequences for LSTM"""
        X, y = [], []
        for i in range(lookback, len(data)):
            X.append(data[i-lookback:i])
            y.append(data[i])
        return np.array(X), np.array(y)
    
    def build_lstm_model(self, input_shape):
        """Build LSTM model for feature extraction"""
        model = keras.Sequential([
            layers.LSTM(128, return_sequences=True, input_shape=input_shape),
            layers.Dropout(0.2),
            layers.LSTM(64, return_sequences=False),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, symbol):
        """Train LSTM + XGBoost hybrid model"""
        print(f"Training model for {symbol}...")
        
        # Fetch and prepare data
        df = self.fetch_data(symbol)
        df = self.engineer_features(df)
        
        # Prepare price data for LSTM
        prices = df['Close'].values.reshape(-1, 1)
        scaled_prices = self.scaler_price.fit_transform(prices)
        
        # Create LSTM sequences
        X_lstm, y_lstm = self.prepare_lstm_data(scaled_prices, self.lstm_lookback)
        
        # Train LSTM
        if X_lstm.shape[0] < 100:
            raise ValueError(f"Insufficient data for training {symbol}")
        
        self.lstm_model = self.build_lstm_model((X_lstm.shape[1], 1))
        self.lstm_model.fit(X_lstm, y_lstm, epochs=50, batch_size=32, verbose=0, validation_split=0.1)
        
        # Extract LSTM features for XGBoost
        lstm_features = self.lstm_model.predict(X_lstm, verbose=0)
        
        # Prepare additional features for XGBoost
        feature_cols = ['MA_5', 'MA_20', 'MA_50', 'RSI', 'MACD', 'Signal', 
                       'BB_middle', 'BB_upper', 'BB_lower', 'Volume_change', 'Price_change']
        
        # Align features with LSTM output
        features_df = df[feature_cols].iloc[self.lstm_lookback:].reset_index(drop=True)
        scaled_features = self.scaler_features.fit_transform(features_df)
        
        # Combine LSTM features with technical features
        X_combined = np.hstack([lstm_features, scaled_features[:len(lstm_features)]])
        y_combined = y_lstm
        
        # Train XGBoost
        X_train, X_test, y_train, y_test = train_test_split(X_combined, y_combined, test_size=0.2, random_state=42)
        
        self.xgb_model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        self.xgb_model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.xgb_model.score(X_train, y_train)
        test_score = self.xgb_model.score(X_test, y_test)
        print(f"Training complete. Train R²: {train_score:.4f}, Test R²: {test_score:.4f}")
        
        return train_score, test_score
    
    def predict(self, symbol, days_ahead=1):
        """Predict future prices"""
        # Fetch latest data
        df = self.fetch_data(symbol, period='1y')
        df = self.engineer_features(df)
        
        # Train if models don't exist (for demo; in production cache models)
        if self.lstm_model is None or self.xgb_model is None:
            self.train(symbol)
        
        # Prepare last sequence for LSTM
        prices = df['Close'].values.reshape(-1, 1)
        scaled_prices = self.scaler_price.transform(prices)
        
        last_sequence = scaled_prices[-self.lstm_lookback:].reshape(1, self.lstm_lookback, 1)
        
        predictions = []
        current_sequence = last_sequence.copy()
        
        for _ in range(days_ahead):
            # LSTM feature extraction
            lstm_feature = self.lstm_model.predict(current_sequence, verbose=0)
            
            # Get latest technical features
            feature_cols = ['MA_5', 'MA_20', 'MA_50', 'RSI', 'MACD', 'Signal', 
                           'BB_middle', 'BB_upper', 'BB_lower', 'Volume_change', 'Price_change']
            latest_features = df[feature_cols].iloc[-1:].values
            scaled_latest_features = self.scaler_features.transform(latest_features)
            
            # Combine features
            combined_features = np.hstack([lstm_feature, scaled_latest_features])
            
            # XGBoost prediction
            next_price_scaled = self.xgb_model.predict(combined_features)[0]
            next_price = self.scaler_price.inverse_transform([[next_price_scaled]])[0][0]
            
            predictions.append(next_price)
            
            # Update sequence for next prediction
            current_sequence = np.roll(current_sequence, -1, axis=1)
            current_sequence[0, -1, 0] = next_price_scaled
        
        return predictions
    
    def predict_next_day_and_week(self, symbol):
        """Predict next day and next week (7 days)"""
        try:
            # Get current price
            df = self.fetch_data(symbol, period='5d')
            current_price = df['Close'].iloc[-1]
            last_date = df.index[-1]
            if isinstance(last_date, pd.Timestamp):
                last_date = last_date.to_pydatetime()

            # Helper to compute next business day (Mon-Fri, ignores holidays)
            def next_business_day(d: datetime):
                nd = d + timedelta(days=1)
                while nd.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
                    nd = nd + timedelta(days=1)
                return nd

            # Helper to format target metadata
            def format_target(dt: datetime):
                return {
                    'iso': dt.isoformat(),
                    'date': dt.date().isoformat(),
                    'day': dt.strftime('%A'),
                    'year': dt.year,
                }
            
            # Predict next day
            next_day_pred = self.predict(symbol, days_ahead=1)[0]
            next_day_target = next_business_day(last_date)
            
            # Predict next week (7 days)
            week_preds = self.predict(symbol, days_ahead=7)
            next_week_pred = week_preds[-1]  # 7th day prediction
            next_week_target = last_date + timedelta(days=7)
            
            return {
                'symbol': symbol,
                'current_price': float(current_price),
                'next_day': {
                    'predicted_price': float(next_day_pred),
                    'change': float(next_day_pred - current_price),
                    'change_percent': float((next_day_pred - current_price) / current_price * 100),
                    'target': format_target(next_day_target)
                },
                'next_week': {
                    'predicted_price': float(next_week_pred),
                    'change': float(next_week_pred - current_price),
                    'change_percent': float((next_week_pred - current_price) / current_price * 100),
                    'target': format_target(next_week_target)
                },
                'confidence': 'medium',  # Can be enhanced with prediction intervals
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            raise Exception(f"Prediction failed for {symbol}: {str(e)}")
