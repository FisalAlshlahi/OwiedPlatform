const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// إعدادات أساسية فقط
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS بسيط
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// مسار اختبار بسيط
app.get('/', (req, res) => {
    res.json({
        message: 'Server is working!',
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

// مسار اختبار الـ headers
app.get('/test', (req, res) => {
    res.json({
        message: 'Test endpoint working',
        headers: req.headers,
        method: req.method,
        url: req.url
    });
});

// معالج 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl
    });
});

// معالج الأخطاء
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Server Error',
        message: err.message
    });
});

// تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Simple server running on http://localhost:${PORT}`);
    console.log(`📝 Test it: curl http://localhost:${PORT}/`);
});

module.exports = app;

