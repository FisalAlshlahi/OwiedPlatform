import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email,
                password
            });

            alert('Login successful!');
            localStorage.setItem('token', response.data.token);
            onLoginSuccess(response.data.user.role);
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your credentials.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f2f2f2'
        }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    padding: '30px',
                    border: '1px solid #ccc',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                }}
            >
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <button type="submit" style={{
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}>
                    تسجيل الدخول
                </button>
            </form>
        </div>
    );
};

export default Login;
