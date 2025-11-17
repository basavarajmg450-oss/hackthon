const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Backend is running successfully!');
});

app.post('/api/data', (req, res) => {
  const { name } = req.body;
  res.json({ message: `Hello, ${name}! Your data was received.` });
});

app.listen(PORT, '0.0.0.0', () => {

  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});