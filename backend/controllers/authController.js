const pool = require('../models/db');
const jwt = require('jsonwebtoken');

// تسجيل الدخول
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    // البحث عن المستخدم في قاعدة البيانات
    const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    
    // طباعة نتيجة الاستعلام للتشخيص
    console.log('📦 user query result =', userResult);
    console.log('📦 user.rows =', userResult.rows);

    // التحقق من وجود المستخدم
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const user = userResult.rows[0];
    
    // التحقق من كلمة المرور
    if (user.password !== password) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // إنشاء توكن JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      'your_jwt_secret_key',  // يجب تغييرها إلى مفتاح آمن وتخزينها في متغيرات البيئة
      { expiresIn: '24h' }
    );

    // إرسال البيانات مع التوكن
    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    // طباعة الخطأ بالتفصيل للتشخيص
    console.error('خطأ في تسجيل الدخول:', err);
    res.status(500).json({ message: 'حدث خطأ في الخادم', error: err.message });
  }
};
