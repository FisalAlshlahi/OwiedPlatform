const express = require('express');
const cors = require('cors');
const supervisorRoutes = require('./routes/supervisorRoutes');
const app = express();
const PORT = 3000;

app.use(cors()); // حل مشكلة CORS
app.use(express.json()); // Middleware to parse JSON

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes'); // ✅ استيراد مسارات الطالب

app.use('/api/auth', authRoutes);     // ✅ مسارات تسجيل الدخول
app.use('/api', studentRoutes);       // ✅ مسارات الطالب (لوحة الطالب)
app.use('/api', supervisorRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Welcome to the EPA Project Backend!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
