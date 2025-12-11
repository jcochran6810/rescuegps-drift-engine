const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RescueGPS Drift Engine',
    version: '1.0.3',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🚀 RescueGPS Drift Engine Server');
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;