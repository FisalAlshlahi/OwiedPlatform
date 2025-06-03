import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SupervisorDashboard = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [evaluations, setEvaluations] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/supervisor/students', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStudents(response.data);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, []);

    const handleSelectStudent = async (studentId) => {
        try {
            const response = await axios.get(`http://localhost:3000/api/supervisor/evaluations/${studentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSelectedStudent(studentId);
            setEvaluations(response.data);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
        }
    };

    const handleSubmitEvaluation = async (behaviorId, isMet) => {
        try {
            await axios.post('http://localhost:3000/api/supervisor/evaluate', {
                studentId: selectedStudent,
                behaviorId,
                isMet
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            alert('Evaluation submitted successfully!');
        } catch (error) {
            console.error('Error submitting evaluation:', error);
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>لوحة المشرف</h2>

            <h3>قائمة الطلاب</h3>
            <ul>
                {students.map((student) => (
                    <li key={student.id} onClick={() => handleSelectStudent(student.id)} style={{ cursor: 'pointer' }}>
                        {student.name}
                    </li>
                ))}
            </ul>

            {selectedStudent && (
                <div>
                    <h3>تقييم الطالب</h3>
                    {evaluations.map((evalItem) => (
                        <div key={evalItem.id}>
                            <p>{evalItem.description}</p>
                            <button onClick={() => handleSubmitEvaluation(evalItem.id, true)}>مستوفى</button>
                            <button onClick={() => handleSubmitEvaluation(evalItem.id, false)}>غير مستوفى</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;
