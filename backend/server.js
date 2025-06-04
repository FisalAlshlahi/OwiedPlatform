const express = require('express');
const cors = require('cors');
const supervisorRoutes = require('./routes/supervisorRoutes');
const app = express();
const PORT = 3000;

// تكوين CORS للسماح بالوصول من أي مصدر (للتطوير فقط)
app.use(cors({
  origin: '*', // السماح لجميع المصادر بالوصول
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware لتحليل طلبات JSON
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', supervisorRoutes);

// مسار اختبار
app.get('/', (req, res) => {
    res.send('Welcome to the EPA Project Backend!');
});

// بدء تشغيل الخادم على جميع الواجهات
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`For external access use: http://<your-ip-address>:${PORT}`);
});
