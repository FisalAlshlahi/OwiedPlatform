const express = require('express');
const cors = require('cors');
const http = require('http');

// استيراد الـ routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// =====================================================
// حل مشكلة 431 Request Header Fields Too Large
// =====================================================

// 1. زيادة حد الـ headers على مستوى Node.js
// يجب تشغيل الخادم مع: node --max-http-header-size=32768 server.js
// أو تحديد الحد برمجياً (إذا كان ممكناً)

// 2. إنشاء خادم HTTP مخصص مع إعدادات محسنة
const server = http.createServer({
    // زيادة حد الـ headers إلى 32KB (الافتراضي 8KB)
    maxHeaderSize: 32768,
    // زيادة timeout للطلبات الطويلة
    timeout: 120000,
    // زيادة حد الـ headers count
    maxHeadersCount: 2000
}, app);

// =====================================================
// إعدادات Express Middleware
// =====================================================

// 3. إعدادات محسنة لـ body parsing
app.use(express.json({ 
    limit: '50mb',
    // إعدادات إضافية لتحسين الأداء
    strict: true,
    type: 'application/json'
}));

app.use(express.urlencoded({ 
    limit: '50mb', 
    extended: true,
    // إعدادات إضافية
    parameterLimit: 50000
}));

// 4. إعدادات CORS محسنة
app.use(cors({
    origin: function(origin, callback) {
        // السماح لجميع المصادر في بيئة التطوير
        // يمكن تخصيص هذا في بيئة الإنتاج
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'Expires',
        'X-Custom-Header'
    ],
    credentials: true,
    // زيادة حد الـ preflight cache
    maxAge: 86400 // 24 ساعة
}));

// =====================================================
// Middleware إضافي لإدارة الـ Headers
// =====================================================

// 5. Middleware لضغط الاستجابات
const compression = require('compression');
app.use(compression({
    // ضغط جميع الاستجابات أكبر من 1KB
    threshold: 1024,
    // مستوى الضغط (1-9)
    level: 6,
    // ضغط جميع أنواع المحتوى
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// 6. Middleware لمراقبة حجم الـ Headers
app.use((req, res, next) => {
    // حساب حجم الـ headers تقريبياً
    const headersSize = JSON.stringify(req.headers).length;
    
    // تسجيل تحذير إذا كان الحجم كبير
    if (headersSize > 16384) { // 16KB
        console.warn(`Large headers detected: ${headersSize} bytes`);
        console.warn('Headers:', Object.keys(req.headers));
    }
    
    // إضافة معلومات الحجم للاستجابة (للتطوير)
    if (process.env.NODE_ENV === 'development') {
        res.setHeader('X-Request-Headers-Size', headersSize);
    }
    
    next();
});

// 7. Middleware لتحسين الـ Security Headers
app.use((req, res, next) => {
    // إزالة headers غير ضرورية
    res.removeHeader('X-Powered-By');
    
    // إضافة security headers مضغوطة
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
});

// =====================================================
// Routes Configuration
// =====================================================

// 8. تطبيق الـ routes
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', supervisorRoutes);

// 9. مسار اختبار الـ headers
app.get('/api/test-headers', (req, res) => {
    const headersInfo = {
        size: JSON.stringify(req.headers).length,
        count: Object.keys(req.headers).length,
        headers: req.headers,
        userAgent: req.get('User-Agent'),
        authorization: req.get('Authorization') ? 'Present' : 'Missing'
    };
    
    res.json({
        message: 'Headers test successful',
        info: headersInfo,
        limits: {
            maxHeaderSize: '32KB',
            maxHeadersCount: 2000,
            bodyLimit: '50MB'
        }
    });
});

// 10. مسار اختبار عام
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the EPA Project Backend!',
        version: '1.1.0',
        features: [
            'Enhanced header size limits',
            'Compression enabled',
            'CORS optimized',
            'Security headers'
        ]
    });
});

// =====================================================
// Error Handling
// =====================================================

// 11. معالج خطأ 431 مخصص
app.use((err, req, res, next) => {
    if (err.code === 'HPE_HEADER_OVERFLOW' || err.status === 431) {
        return res.status(431).json({
            error: 'Request Header Fields Too Large',
            message: 'حجم رؤوس الطلب كبير جداً',
            suggestion: 'يرجى تقليل حجم التوكن أو الـ headers الأخرى',
            maxSize: '32KB'
        });
    }
    
    // معالجة الأخطاء الأخرى
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'حدث خطأ في الخادم'
    });
});

// 12. معالج 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'المسار غير موجود',
        path: req.originalUrl
    });
});

// =====================================================
// Server Startup
// =====================================================

// 13. بدء تشغيل الخادم مع الإعدادات المحسنة
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Max header size: 32KB`);
    console.log(`📦 Body limit: 50MB`);
    console.log(`🔒 Security headers enabled`);
    console.log(`📋 Compression enabled`);
    
    // معلومات إضافية للتطوير
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode active`);
        console.log(`🧪 Test headers endpoint: http://localhost:${PORT}/api/test-headers`);
    }
});

// 14. معالجة إغلاق الخادم بأمان
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;

