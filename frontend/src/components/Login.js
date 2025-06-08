import React, { useState } from 'react';
import axios from 'axios';

// استخدام متغير بيئي أو تكوين مركزي لعنوان API
// يمكن تغيير هذا العنوان حسب بيئة التشغيل
const API_BASE_URL = 'http://localhost:5000';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // استخدام المتغير المركزي لعنوان API
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            
            // إضافة معلومات المستخدم للتخزين المحلي للاستخدام لاحقاً
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // تأخير قصير قبل إعادة التوجيه
            setTimeout(() => {
                onLoginSuccess(response.data.user.role);
            }, 500);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // عرض رسالة خطأ أكثر تفصيلاً
            if (error.response) {
                // الخادم استجاب برمز حالة خارج نطاق 2xx
                setError(error.response.data.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
            } else if (error.request) {
                // لم يتم استلام استجابة من الخادم
                setError('لا يمكن الوصول إلى الخادم. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً.');
            } else {
                // حدث خطأ أثناء إعداد الطلب
                setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f5f8fa',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '30px',
                borderRadius: '10px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#333',
                    marginBottom: '25px'
                }}>
                    تسجيل الدخول إلى منصة عويض
                </h2>
                
                {error && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '15px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '5px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#555'
                        }}>
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ 
                                width: '100%',
                                padding: '12px',
                                fontSize: '16px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#555'
                        }}>
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ 
                                width: '100%',
                                padding: '12px',
                                fontSize: '16px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: loading ? '#90caf9' : '#1976d2',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
                
                <div style={{ 
                    marginTop: '20px', 
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    <p>للمساعدة، يرجى التواصل مع مسؤول النظام</p>
                    <p style={{ 
                        marginTop: '5px', 
                        fontSize: '12px',
                        color: '#999'
                    }}>
                        منصة عويض - نظام إدارة الكفاءات السريرية
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
