const pool = require('../models/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'owied_platform_secret_key';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const userData = user.rows[0];
    
    // تحقق من كلمة المرور
    if (userData.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // توليد توكن بحجم صغير
    const token = jwt.sign(
      { 
        id: userData.id,
        role: userData.role
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' } // صلاحية أقصر
    );
    
    res.json({ 
      message: 'Login successful', 
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};