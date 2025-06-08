const express = require('express');
const cors = require('cors');
const supervisorRoutes = require('./routes/supervisorRoutes');
const app = express();
const PORT = 5000;

// زيادة حجم الرؤوس المسموح به
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// تكوين CORS للسماح بالوصول من أي مصدر
app.use(cors({
  origin: '*',
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

// بدء تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});