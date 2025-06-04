import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import './StudentDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCoreEpa, setSelectedCoreEpa] = useState(null);
  const [selectedSmallerEpa, setSelectedSmallerEpa] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch detailed results
        const resultsResponse = await axios.get('http://localhost:3000/api/student/detailed-results', { headers });
        setDashboardData(resultsResponse.data);
        
        // If there are Core EPAs, select the first one by default
        if (resultsResponse.data?.coreEpas?.length > 0) {
          setSelectedCoreEpa(resultsResponse.data.coreEpas[0].id);
        }
        
        // Fetch recommendations
        const recommendationsResponse = await axios.get('http://localhost:3000/api/student/recommendations', { headers });
        setRecommendations(recommendationsResponse.data);
        
        // Fetch achievements
        const achievementsResponse = await axios.get('http://localhost:3000/api/student/achievements', { headers });
        setAchievements(achievementsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Core EPA selection
  const handleCoreEpaSelect = (epaId) => {
    setSelectedCoreEpa(epaId);
    setSelectedSmallerEpa(null); // Reset smaller EPA selection
  };

  // Handle Smaller EPA selection
  const handleSmallerEpaSelect = (epaId) => {
    setSelectedSmallerEpa(epaId);
  };

  // Handle timeframe change for progress charts
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Prepare data for Core EPA overview chart
  const prepareOverviewChartData = () => {
    if (!dashboardData?.coreEpas) return null;
    
    return {
      labels: dashboardData.coreEpas.map(epa => epa.name),
      datasets: [
        {
          label: 'نسبة الإتقان',
          data: dashboardData.coreEpas.map(epa => epa.percentageScore),
          backgroundColor: dashboardData.coreEpas.map(epa => 
            epa.percentageScore >= 80 ? 'rgba(75, 192, 75, 0.6)' : 
            epa.percentageScore >= 60 ? 'rgba(255, 205, 86, 0.6)' : 
            'rgba(255, 99, 132, 0.6)'
          ),
          borderColor: dashboardData.coreEpas.map(epa => 
            epa.percentageScore >= 80 ? 'rgba(75, 192, 75, 1)' : 
            epa.percentageScore >= 60 ? 'rgba(255, 205, 86, 1)' : 
            'rgba(255, 99, 132, 1)'
          ),
          borderWidth: 1,
        }
      ]
    };
  };

  // Prepare data for progress over time chart
  const prepareProgressTimeChartData = () => {
    if (!dashboardData?.progressOverTime) return null;
    
    // Filter data based on selected timeframe if needed
    let filteredData = dashboardData.progressOverTime;
    if (timeframe !== 'all') {
      const cutoffDate = new Date();
      if (timeframe === 'month') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      } else if (timeframe === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      }
      filteredData = dashboardData.progressOverTime.filter(item => 
        new Date(item.week) >= cutoffDate
      );
    }
    
    // Group by Core EPA
    const coreEpas = [...new Set(filteredData.map(item => item.coreEpaId))];
    const datasets = coreEpas.map(epaId => {
      const epaData = filteredData.filter(item => item.coreEpaId === epaId);
      const epaName = epaData[0]?.coreEpaName || `Core EPA ${epaId}`;
      
      // Generate a consistent color based on epaId
      const hue = (epaId * 137) % 360;
      
      return {
        label: epaName,
        data: epaData.map(item => item.percentageScore),
        borderColor: `hsl(${hue}, 70%, 60%)`,
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.2)`,
        fill: false,
        tension: 0.3
      };
    });
    
    return {
      labels: [...new Set(filteredData.map(item => {
        const date = new Date(item.week);
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      }))],
      datasets
    };
  };

  // Prepare data for Smaller EPAs within selected Core EPA
  const prepareSmallerEpasChartData = () => {
    if (!dashboardData?.smallerEpas || !selectedCoreEpa) return null;
    
    const filteredEpas = dashboardData.smallerEpas.filter(
      epa => epa.coreEpaId === selectedCoreEpa
    );
    
    return {
      labels: filteredEpas.map(epa => epa.name),
      datasets: [
        {
          label: 'نسبة الإتقان',
          data: filteredEpas.map(epa => epa.percentageScore),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  // Prepare data for Activities within selected Smaller EPA
  const prepareActivitiesChartData = () => {
    if (!dashboardData?.activities || !selectedSmallerEpa) return null;
    
    const filteredActivities = dashboardData.activities.filter(
      activity => activity.smallerEpaId === selectedSmallerEpa
    );
    
    return {
      labels: filteredActivities.map(activity => activity.name),
      datasets: [
        {
          label: 'نسبة الإتقان',
          data: filteredActivities.map(activity => activity.percentageScore),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  // Prepare data for strengths and weaknesses radar chart
  const prepareStrengthsWeaknessesChartData = () => {
    if (!dashboardData?.analysis) return null;
    
    const allEpas = [
      ...dashboardData.analysis.strengths,
      ...dashboardData.analysis.weaknesses
    ];
    
    return {
      labels: allEpas.map(epa => epa.name),
      datasets: [
        {
          label: 'نسبة الإتقان',
          data: allEpas.map(epa => epa.percentageScore),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          pointBackgroundColor: allEpas.map(epa => 
            epa.percentageScore >= 70 ? 'rgba(75, 192, 75, 1)' : 'rgba(255, 99, 132, 1)'
          ),
          pointRadius: 5
        }
      ]
    };
  };

  // Prepare data for achievements chart
  const prepareAchievementsChartData = () => {
    if (!achievements?.stats) return null;
    
    return {
      labels: ['ذهبية', 'فضية', 'برونزية'],
      datasets: [
        {
          data: [
            achievements.stats.goldBadges,
            achievements.stats.silverBadges,
            achievements.stats.bronzeBadges
          ],
          backgroundColor: [
            'rgba(255, 215, 0, 0.6)',
            'rgba(192, 192, 192, 0.6)',
            'rgba(205, 127, 50, 0.6)'
          ],
          borderColor: [
            'rgba(255, 215, 0, 1)',
            'rgba(192, 192, 192, 1)',
            'rgba(205, 127, 50, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="student-dashboard loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="student-dashboard error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>لوحة المتدرب</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            نظرة عامة
          </button>
          <button 
            className={activeTab === 'details' ? 'active' : ''} 
            onClick={() => setActiveTab('details')}
          >
            تفاصيل التقدم
          </button>
          <button 
            className={activeTab === 'recommendations' ? 'active' : ''} 
            onClick={() => setActiveTab('recommendations')}
          >
            التوصيات
          </button>
          <button 
            className={activeTab === 'achievements' ? 'active' : ''} 
            onClick={() => setActiveTab('achievements')}
          >
            الإنجازات
          </button>
        </div>
      </header>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="dashboard-section overview">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>الإتقان الإجمالي</h3>
              <div className="big-number">
                {Math.round(
                  dashboardData.coreEpas.reduce((sum, epa) => sum + epa.metBehaviors, 0) / 
                  dashboardData.coreEpas.reduce((sum, epa) => sum + epa.totalBehaviors, 0) * 100
                )}%
              </div>
              <p>من إجمالي السلوكيات</p>
            </div>
            <div className="summary-card">
              <h3>Core EPAs المتقنة</h3>
              <div className="big-number">
                {dashboardData.coreEpas.filter(epa => epa.percentageScore >= 80).length}
              </div>
              <p>من أصل {dashboardData.coreEpas.length}</p>
            </div>
            {achievements && (
              <div className="summary-card">
                <h3>الشارات المكتسبة</h3>
                <div className="big-number">
                  {achievements.stats.totalBadges}
                </div>
                <p>شارة إنجاز</p>
              </div>
            )}
          </div>

          <div className="chart-container">
            <h3>التقدم في Core EPAs</h3>
            {prepareOverviewChartData() && (
              <Bar 
                data={prepareOverviewChartData()} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'نسبة الإتقان لكل Core EPA'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `نسبة الإتقان: ${context.raw}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'النسبة المئوية للإتقان'
                      }
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3>تطور التقدم عبر الزمن</h3>
              <div className="timeframe-selector">
                <button 
                  className={timeframe === 'week' ? 'active' : ''} 
                  onClick={() => handleTimeframeChange('week')}
                >
                  أسبوع
                </button>
                <button 
                  className={timeframe === 'month' ? 'active' : ''} 
                  onClick={() => handleTimeframeChange('month')}
                >
                  شهر
                </button>
                <button 
                  className={timeframe === 'all' ? 'active' : ''} 
                  onClick={() => handleTimeframeChange('all')}
                >
                  الكل
                </button>
              </div>
            </div>
            {prepareProgressTimeChartData() && (
              <Line 
                data={prepareProgressTimeChartData()} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'تطور نسبة الإتقان عبر الزمن'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'النسبة المئوية للإتقان'
                      }
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-container">
            <h3>نقاط القوة والضعف</h3>
            {prepareStrengthsWeaknessesChartData() && (
              <Radar 
                data={prepareStrengthsWeaknessesChartData()} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'تحليل نقاط القوة والضعف'
                    }
                  },
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && dashboardData && (
        <div className="dashboard-section details">
          <div className="hierarchy-navigation">
            <div className="core-epas-list">
              <h3>Core EPAs</h3>
              <ul>
                {dashboardData.coreEpas.map(epa => (
                  <li 
                    key={epa.id} 
                    className={selectedCoreEpa === epa.id ? 'selected' : ''}
                    onClick={() => handleCoreEpaSelect(epa.id)}
                  >
                    <div className="epa-name">{epa.name}</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${epa.percentageScore}%` }}
                      ></div>
                    </div>
                    <div className="percentage">{epa.percentageScore}%</div>
                  </li>
                ))}
              </ul>
            </div>

            {selectedCoreEpa && (
              <div className="smaller-epas-list">
                <h3>Smaller EPAs</h3>
                <ul>
                  {dashboardData.smallerEpas
                    .filter(epa => epa.coreEpaId === selectedCoreEpa)
                    .map(epa => (
                      <li 
                        key={epa.id} 
                        className={selectedSmallerEpa === epa.id ? 'selected' : ''}
                        onClick={() => handleSmallerEpaSelect(epa.id)}
                      >
                        <div className="epa-name">{epa.name}</div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${epa.percentageScore}%` }}
                          ></div>
                        </div>
                        <div className="percentage">{epa.percentageScore}%</div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div className="detail-charts">
            {selectedCoreEpa && !selectedSmallerEpa && (
              <div className="chart-container">
                <h3>
                  {dashboardData.coreEpas.find(epa => epa.id === selectedCoreEpa)?.name}
                </h3>
                {prepareSmallerEpasChartData() && (
                  <Bar 
                    data={prepareSmallerEpasChartData()} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: true,
                          text: 'نسبة الإتقان لكل Smaller EPA'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                )}
              </div>
            )}

            {selectedSmallerEpa && (
              <div className="chart-container">
                <h3>
                  {dashboardData.smallerEpas.find(epa => epa.id === selectedSmallerEpa)?.name}
                </h3>
                {prepareActivitiesChartData() && (
                  <Bar 
                    data={prepareActivitiesChartData()} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: true,
                          text: 'نسبة الإتقان لكل Activity'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                )}
              </div>
            )}

            {selectedSmallerEpa && (
              <div className="behaviors-list">
                <h3>السلوكيات (Behaviors)</h3>
                <table>
                  <thead>
                    <tr>
                      <th>الوصف</th>
                      <th>الحالة</th>
                      <th>التقييم</th>
                      <th>تاريخ التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.behaviors
                      .filter(behavior => behavior.smallerEpaId === selectedSmallerEpa)
                      .map(behavior => (
                        <tr key={behavior.id} className={behavior.isMet ? 'met' : 'not-met'}>
                          <td>{behavior.description}</td>
                          <td>
                            <span className={`status-badge ${behavior.isMet ? 'met' : 'not-met'}`}>
                              {behavior.isMet ? 'متقن' : 'غير متقن'}
                            </span>
                          </td>
                          <td>
                            {behavior.rating ? (
                              <div className="rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span 
                                    key={star} 
                                    className={star <= behavior.rating ? 'star filled' : 'star'}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-rating">-</span>
                            )}
                          </td>
                          <td>
                            {behavior.evaluationDate ? 
                              new Date(behavior.evaluationDate).toLocaleDateString('ar-SA') : 
                              '-'
                            }
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && recommendations && (
        <div className="dashboard-section recommendations">
          <div className="section-header">
            <h2>التوصيات والخطة التطويرية</h2>
            <p>بناءً على تقييمك الحالي، إليك بعض التوصيات لتحسين أدائك:</p>
          </div>

          <div className="recommendations-container">
            <div className="weakest-activities">
              <h3>الأنشطة التي تحتاج إلى تحسين</h3>
              <ul className="activity-cards">
                {recommendations.weakestActivities.map((activity, index) => (
                  <li key={index} className="activity-card">
                    <div className="activity-header">
                      <h4>{activity.activityName}</h4>
                      <span className="completion-rate">{activity.completionRate}%</span>
                    </div>
                    <div className="activity-meta">
                      <span>{activity.coreEpaName}</span>
                      <span>→</span>
                      <span>{activity.smallerEpaName}</span>
                    </div>
                    <p className="recommendation-text">{activity.recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="behaviors-to-improve">
              <h3>السلوكيات المستهدفة للتحسين</h3>
              <table>
                <thead>
                  <tr>
                    <th>السلوك</th>
                    <th>النشاط</th>
                    <th>التقييم</th>
                    <th>نصائح للتحسين</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.behaviorsToImprove.map((behavior, index) => (
                    <tr key={index}>
                      <td>{behavior.description}</td>
                      <td>{behavior.activityName}</td>
                      <td>
                        {behavior.rating ? (
                          <div className="rating">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span 
                                key={star} 
                                className={star <= behavior.rating ? 'star filled' : 'star'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="status-badge not-met">غير متقن</span>
                        )}
                      </td>
                      <td>
                        <div className="improvement-tip">
                          {behavior.improvementTips}
                          {behavior.supervisorComments && (
                            <div className="supervisor-comment">
                              <strong>تعليق المشرف:</strong> {behavior.supervisorComments}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && achievements && (
        <div className="dashboard-section achievements">
          <div className="section-header">
            <h2>الإنجازات والشارات</h2>
            <p>تعرف على إنجازاتك وشاراتك التي حصلت عليها:</p>
          </div>

          <div className="achievements-summary">
            <div className="chart-container achievement-chart">
              <h3>توزيع الشارات</h3>
              {prepareAchievementsChartData() && (
                <Doughnut 
                  data={prepareAchievementsChartData()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    },
                    cutout: '60%'
                  }}
                />
              )}
            </div>

            <div className="badges-stats">
              <div className="badge-stat gold">
                <div className="badge-icon">🥇</div>
                <div className="badge-count">{achievements.stats.goldBadges}</div>
                <div className="badge-label">ذهبية</div>
              </div>
              <div className="badge-stat silver">
                <div className="badge-icon">🥈</div>
                <div className="badge-count">{achievements.stats.silverBadges}</div>
                <div className="badge-label">فضية</div>
              </div>
              <div className="badge-stat bronze">
                <div className="badge-icon">🥉</div>
                <div className="badge-count">{achievements.stats.bronzeBadges}</div>
                <div className="badge-label">برونزية</div>
              </div>
            </div>
          </div>

          <div className="badges-container">
            <h3>الشارات المكتسبة</h3>
            <ul className="badges-list">
              {achievements.badges.map((badge, index) => (
                <li key={index} className={`badge-card ${badge.level}`}>
                  <div className="badge-header">
                    <span className="badge-icon">
                      {badge.level === 'gold' ? '🥇' : badge.level === 'silver' ? '🥈' : '🥉'}
                    </span>
                    <h4>{badge.title}</h4>
                  </div>
                  <p>{badge.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
