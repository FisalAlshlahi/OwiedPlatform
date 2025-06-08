import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('students');
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch all required data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                
                // Fetch students
                const studentsResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/supervisor/students`, 
                    { headers }
                );
                setStudents(studentsResponse.data);
                setFilteredStudents(studentsResponse.data);
                
                // Fetch supervisor stats
                const statsResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/supervisor/stats`, 
                    { headers }
                );
                setStats(statsResponse.data);
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter students based on search and status
    useEffect(() => {
        let result = students;
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(student => 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(student => student.status === statusFilter);
        }
        
        setFilteredStudents(result);
    }, [searchTerm, statusFilter, students]);

    // Handle student selection
    const handleSelectStudent = async (studentId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const student = students.find(s => s.id === studentId);
            setSelectedStudent(student);
            
            // Fetch evaluations for selected student
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/supervisor/evaluations/${studentId}`, 
                { headers }
            );
            setEvaluations(response.data);
            
            setActiveTab('evaluate');
            setLoading(false);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            setError('حدث خطأ أثناء تحميل تقييمات الطالب.');
            setLoading(false);
        }
    };

    // Handle evaluation submission
    const handleSubmitEvaluation = async (behaviorId, isMet) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/supervisor/evaluate`, 
                {
                    studentId: selectedStudent.id,
                    behaviorId,
                    isMet
                }, 
                { headers }
            );
            
            // Update local state to reflect the change
            setEvaluations(evaluations.map(item => 
                item.id === behaviorId ? { ...item, isMet } : item
            ));
        } catch (error) {
            console.error('Error submitting evaluation:', error);
            setError('حدث خطأ أثناء تقديم التقييم.');
        }
    };

    // Render loading state
    if (loading) {
        return (
            <div className="supervisor-dashboard loading">
                <div className="loading-spinner"></div>
                <p>جاري تحميل البيانات...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="supervisor-dashboard error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
            </div>
        );
    }

    return (
        <div className="supervisor-dashboard">
            <header className="dashboard-header">
                <h1>لوحة المشرف</h1>
                <div className="tabs">
                    <button 
                        className={activeTab === 'overview' ? 'active' : ''} 
                        onClick={() => setActiveTab('overview')}
                    >
                        نظرة عامة
                    </button>
                    <button 
                        className={activeTab === 'students' ? 'active' : ''} 
                        onClick={() => setActiveTab('students')}
                    >
                        قائمة الطلاب
                    </button>
                    <button 
                        className={activeTab === 'evaluate' ? 'active' : ''} 
                        onClick={() => selectedStudent && setActiveTab('evaluate')}
                        disabled={!selectedStudent}
                    >
                        تقييم الطالب
                    </button>
                </div>
            </header>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="dashboard-section overview">
                    <div className="section-header">
                        <h2>نظرة عامة</h2>
                    </div>

                    <div className="summary-cards">
                        <div className="summary-card">
                            <h3>الطلاب المسؤولين</h3>
                            <div className="big-number">{stats.totalStudents}</div>
                            <p>طالب تحت الإشراف</p>
                        </div>
                        <div className="summary-card">
                            <h3>التقييمات المكتملة</h3>
                            <div className="big-number">{stats.completedEvaluations}</div>
                            <p>تقييم تم إنجازه</p>
                        </div>
                        <div className="summary-card">
                            <h3>متوسط الإتقان</h3>
                            <div className="big-number">{stats.averageMastery}%</div>
                            <p>لجميع الطلاب</p>
                        </div>
                    </div>

                    <div className="section-header">
                        <h2>أحدث التقييمات</h2>
                    </div>

                    <table className="evaluations-table">
                        <thead>
                            <tr>
                                <th>الطالب</th>
                                <th>السلوك</th>
                                <th>الحالة</th>
                                <th>التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentEvaluations.map((evaluation, index) => (
                                <tr key={index}>
                                    <td>{evaluation.studentName}</td>
                                    <td>{evaluation.behaviorName}</td>
                                    <td>
                                        <span className={`status-badge ${evaluation.isMet ? 'met' : 'not-met'}`}>
                                            {evaluation.isMet ? 'مستوفي' : 'غير مستوفي'}
                                        </span>
                                    </td>
                                    <td>{new Date(evaluation.date).toLocaleDateString('ar-SA')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="dashboard-section students">
                    <div className="section-header">
                        <h2>قائمة الطلاب</h2>
                    </div>

                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="ابحث عن طالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">جميع الحالات</option>
                            <option value="active">نشط</option>
                            <option value="pending">قيد التقييم</option>
                            <option value="completed">مكتمل</option>
                        </select>
                    </div>

                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>البريد الإلكتروني</th>
                                <th>الحالة</th>
                                <th>التقييمات المكتملة</th>
                                <th>نسبة الإتقان</th>
                                <th>آخر تقييم</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr 
                                    key={student.id} 
                                    onClick={() => handleSelectStudent(student.id)}
                                    className={selectedStudent?.id === student.id ? 'selected' : ''}
                                >
                                    <td>{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>
                                        <span className={`status-badge ${student.status}`}>
                                            {student.status === 'active' ? 'نشط' : 
                                             student.status === 'pending' ? 'قيد التقييم' : 'مكتمل'}
                                        </span>
                                    </td>
                                    <td>{student.completedEvaluations}/{student.totalBehaviors}</td>
                                    <td>{student.masteryPercentage}%</td>
                                    <td>
                                        {student.lastEvaluationDate ? 
                                            new Date(student.lastEvaluationDate).toLocaleDateString('ar-SA') : 
                                            'لا يوجد'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Evaluate Tab */}
            {activeTab === 'evaluate' && selectedStudent && (
                <div className="dashboard-section evaluate">
                    <div className="student-info-card">
                        <div className="student-info-header">
                            <h3>{selectedStudent.name}</h3>
                            <span className="status-badge">{selectedStudent.status === 'active' ? 'نشط' : 'قيد التقييم'}</span>
                        </div>
                        
                        <div className="student-stats">
                            <div className="student-stat">
                                <div className="student-stat-value">{selectedStudent.completedEvaluations}/{selectedStudent.totalBehaviors}</div>
                                <div className="student-stat-label">التقييمات المكتملة</div>
                            </div>
                            <div className="student-stat">
                                <div className="student-stat-value">{selectedStudent.masteryPercentage}%</div>
                                <div className="student-stat-label">نسبة الإتقان</div>
                            </div>
                            <div className="student-stat">
                                <div className="student-stat-value">
                                    {new Date(selectedStudent.lastEvaluationDate).toLocaleDateString('ar-SA')}
                                </div>
                                <div className="student-stat-label">آخر تقييم</div>
                            </div>
                        </div>
                    </div>

                    <div className="section-header">
                        <h2>تقييم السلوكيات</h2>
                    </div>

                    <table className="evaluations-table">
                        <thead>
                            <tr>
                                <th>السلوك</th>
                                <th>الوصف</th>
                                <th>النشاط</th>
                                <th>الحالة الحالية</th>
                                <th>التقييم</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluations.map((evaluation) => (
                                <tr key={evaluation.id}>
                                    <td>{evaluation.behaviorCode}</td>
                                    <td>{evaluation.description}</td>
                                    <td>{evaluation.activityName}</td>
                                    <td>
                                        <span className={`status-badge ${evaluation.isMet === true ? 'met' : 
                                                         evaluation.isMet === false ? 'not-met' : 'pending'}`}>
                                            {evaluation.isMet === true ? 'مستوفي' : 
                                             evaluation.isMet === false ? 'غير مستوفي' : 'قيد التقييم'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="evaluation-buttons">
                                            <button
                                                className={`met ${evaluation.isMet === true ? 'active' : ''}`}
                                                onClick={() => handleSubmitEvaluation(evaluation.id, true)}
                                            >
                                                مستوفي
                                            </button>
                                            <button
                                                className={`not-met ${evaluation.isMet === false ? 'active' : ''}`}
                                                onClick={() => handleSubmitEvaluation(evaluation.id, false)}
                                            >
                                                غير مستوفي
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;