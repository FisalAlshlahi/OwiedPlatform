import React, { useEffect, useState } from 'react';
import axios from 'axios';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StudentDashboard = () => {
    const [results, setResults] = useState([]);

    // Fetch student results from the backend
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/student/results', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setResults(response.data);
            } catch (error) {
                console.error('Error fetching student results:', error);
            }
        };

        fetchResults();
    }, []);

    // Prepare data for the chart
    const chartData = {
        labels: results.map((result) => result.coreEpaName),
        datasets: [
            {
                label: 'Percentage Score',
                data: results.map((result) => result.percentageScore),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>لوحة الطالب</h2>
            <h3>التقدم في Core EPAs</h3>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            <div style={{ marginTop: '20px' }}>
                <h4>تفاصيل النتائج</h4>
                <ul>
                    {results.map((result, index) => (
                        <li key={index}>
                            <strong>{result.coreEpaName}</strong>: {result.percentageScore}%
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default StudentDashboard;
