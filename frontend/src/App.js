import React, { useState } from 'react';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';

function App() {
    const [userRole, setUserRole] = useState(null);

    const handleLoginSuccess = (role) => {
        setUserRole(role);
    };

    return (
        <div>
            {!userRole ? (
                <Login onLoginSuccess={handleLoginSuccess} />
            ) : userRole === 'student' ? (
                <StudentDashboard />
            ) : userRole === 'supervisor' ? (
                <SupervisorDashboard />
            ) : (
                <div>Role not recognized</div>
            )}
        </div>
    );
}

export default App;
