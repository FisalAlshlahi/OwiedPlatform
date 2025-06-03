const pool = require('../models/db');

// تسجيل الدخول
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    console.log('📦 user.rows =', user.rows);


    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.rows[0].password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', user: user.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
