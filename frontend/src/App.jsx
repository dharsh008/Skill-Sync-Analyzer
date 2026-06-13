import React, { useState, useEffect, useRef } from 'react';
import { Upload, Briefcase, BookOpen, Brain, PieChart, Activity, User, CheckCircle, XCircle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { fetchWithAuth } from './api';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resumeId, setResumeId] = useState(null);
  const [resumeSkills, setResumeSkills] = useState(null);
  
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  
  const [studyPlan, setStudyPlan] = useState(null);
  
  const fileInputRef = useRef(null);

  // Auto-login on load if token exists
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode token or just set a dummy user until robust user fetch is added via backend /me route
      // For now we'll assume logged in
      setUser({ name: "User" });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setResumeId(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert("Only PDF files are supported right now.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth('/resume/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      
      setResumeId(data.resume_id);
      setResumeSkills(data.skills);
      alert("Resume parsed successfully!");
      setActiveTab('dashboard');
      fetchJobs(data.resume_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchJobs = async (rId) => {
    try {
      const res = await fetchWithAuth(`/jobs/match?resume_id=${rId}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startAnalysis = (job) => {
    setSelectedJob(job);
    setActiveTab('analysis');
  };

  const startQuiz = async () => {
    try {
      const res = await fetchWithAuth(`/quiz/${selectedJob.job_id}`);
      if (res.ok) {
        const data = await res.json();
        setQuizQuestions(data);
        setQuizAnswers({});
        setQuizResult(null);
        setActiveTab('quiz');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitQuiz = async () => {
    try {
      const res = await fetchWithAuth(`/quiz/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: quizAnswers })
      });
      if (res.ok) {
        const data = await res.json();
        setQuizResult(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateStudyPlan = async () => {
    try {
      const res = await fetchWithAuth(`/recommendations?resume_id=${resumeId}`);
      if (res.ok) {
        const data = await res.json();
        setStudyPlan(data);
        setActiveTab('study');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderNav = () => (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-background p-6 flex flex-col">
      <div className="mb-12">
        <h1 className="text-2xl font-bold tracking-tighter">SkillSync<span className="text-secondary">AI</span></h1>
      </div>
      <div className="space-y-4 flex-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'upload', label: 'Upload Resume', icon: Upload },
          { id: 'jobs', label: 'Job Matching', icon: Briefcase },
          { id: 'analysis', label: 'Skill Analysis', icon: Brain },
          { id: 'study', label: 'Study Plan', icon: BookOpen },
          { id: 'quiz', label: 'Quiz Module', icon: CheckCircle },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === item.id ? 'bg-primary text-background' : 'text-secondary hover:bg-surface hover:text-primary'
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <button onClick={handleLogout} className="mt-auto text-sm text-secondary hover:text-primary text-left">Logout</button>
    </nav>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-light">Welcome back, <span className="font-bold">{user.name}</span></h2>
            <p className="text-secondary">Your AI-Powered Resume Screening and Skill Recommendation Engine.</p>
            {!resumeId ? (
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm text-center">
                    <p className="mb-4 text-secondary">Start by uploading your resume.</p>
                    <button onClick={() => setActiveTab('upload')} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-background">Go to Upload</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-center items-center">
                        <Activity size={32} className="mb-2 text-primary" />
                        <h3 className="text-xl font-medium">Resume Active</h3>
                        <p className="text-sm text-secondary truncate w-full text-center mt-2 capitalize">{resumeSkills?.programming?.length || 0} Programming Skills Found</p>
                    </div>
                </div>
            )}
          </div>
        );
      case 'upload':
        return (
          <div className="flex h-[60vh] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-all hover:border-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload size={48} className="mb-4 text-secondary" />
            <h3 className="mb-2 text-xl font-medium">Drag & Drop Resume</h3>
            <p className="mb-6 text-sm text-secondary">Supported formats: PDF</p>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" />
            <button className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95">
              Browse Files
            </button>
            {resumeId && <p className="mt-4 text-green-500 flex items-center"><CheckCircle size={16} className="mr-2"/> Resume uploaded successfully</p>}
          </div>
        );
      case 'jobs':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-light">Target <span className="font-bold">Roles</span></h2>
            {!resumeId ? (
                <p className="text-secondary">Please upload your resume first to see matches.</p>
            ) : (
                <div className="grid gap-4">
                {jobs.map((j, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface p-6">
                    <div>
                    <h3 className="text-xl font-bold">{j.role_title}</h3>
                    <p className="text-secondary">{j.company_name}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-3xl font-bold">{Math.round(j.match_percentage)}%</div>
                            <div className="text-xs text-secondary">Match</div>
                        </div>
                        <button onClick={() => startAnalysis(j)} className="rounded-md bg-primary px-4 py-2 text-sm text-background font-medium hover:opacity-90 transition-opacity">
                            Analyze
                        </button>
                    </div>
                </div>
                ))}
                </div>
            )}
          </div>
        );
      case 'analysis':
        if (!selectedJob) return <div className="p-6">Please select a job from the Job Matching tab first.</div>;
        const matchScore = Math.round(selectedJob.match_percentage);
        const isEligible = matchScore >= 85;
        
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-light">Analysis for <span className="font-bold">{selectedJob.role_title} at {selectedJob.company_name}</span></h2>
                
                <div className="rounded-xl border border-border bg-surface p-8 text-center flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-full border-8 border-surface-light flex items-center justify-center mb-6">
                        <div className="text-6xl font-bold">{matchScore}%</div>
                    </div>
                    
                    <h3 className="text-2xl font-medium mb-4">
                        {isEligible ? "Excellent Match!" : "Needs Improvement"}
                    </h3>
                    <p className="text-secondary max-w-lg mb-8">
                        {isEligible 
                            ? "Your resume strongly matches the requirements for this role. You are eligible to take the technical assessment quiz."
                            : "Your current skills are below the 85% requirement for this role. Follow the tailored study plan to bridge the gap."}
                    </p>
                    
                    {isEligible ? (
                        <button onClick={startQuiz} className="rounded-md bg-white text-black px-8 py-3 text-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-all">
                            <CheckCircle size={24} /> Take Eligibility Quiz
                        </button>
                    ) : (
                        <button onClick={generateStudyPlan} className="rounded-md border border-primary text-primary px-8 py-3 text-lg font-bold flex items-center gap-2 hover:bg-primary hover:text-background transition-all">
                            <BookOpen size={24} /> Generate Study Plan
                        </button>
                    )}
                </div>
            </div>
        );
      case 'quiz':
        if (!quizQuestions.length) return <div className="p-6">No quiz loaded. Please start from Analysis.</div>;
        
        if (quizResult) {
            const passed = quizResult.percentage >= 70;
            return (
                <div className="space-y-6">
                    <h2 className="text-3xl font-light">Quiz <span className="font-bold">Results</span></h2>
                    <div className="rounded-xl border border-border bg-surface p-12 text-center">
                        {passed ? (
                            <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                        ) : (
                            <XCircle size={64} className="mx-auto mb-4 text-red-500" />
                        )}
                        <div className="text-5xl font-bold mb-2">{Math.round(quizResult.percentage)}%</div>
                        <p className="text-secondary text-lg mb-6">You scored {quizResult.score} out of {quizResult.total}</p>
                        
                        <div className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {passed ? "ELIGIBLE TO APPLY" : "NOT ELIGIBLE"}
                        </div>
                    </div>
                </div>
            )
        }
        
        return (
            <div className="space-y-8 max-w-3xl">
                <h2 className="text-3xl font-light">Technical <span className="font-bold">Assessment</span></h2>
                {quizQuestions.map((q, i) => (
                    <div key={q.id} className="rounded-xl border border-border bg-surface p-6">
                        <h3 className="text-lg font-medium mb-4">{i+1}. {q.question}</h3>
                        <div className="space-y-2">
                            {q.options.map(opt => (
                                <label key={opt} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${quizAnswers[q.id] === opt ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500'}`}>
                                    <input 
                                        type="radio" 
                                        name={`q_${q.id}`} 
                                        value={opt} 
                                        checked={quizAnswers[q.id] === opt}
                                        onChange={() => setQuizAnswers({...quizAnswers, [q.id]: opt})}
                                        className="mr-3"
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                <button 
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                    className="w-full rounded-md bg-primary py-3 font-bold text-background disabled:opacity-50"
                >
                    Submit Quiz
                </button>
            </div>
        );
      case 'study':
        if (!studyPlan) return <div className="p-6">Generate a plan from the Analysis tab first.</div>;
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-light">Personalized <span className="font-bold">Study Plan</span></h2>
                <div className="grid gap-4">
                    {studyPlan.study_plan.map((item, i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold capitalize">{item.topic}</h3>
                                <p className="text-secondary mt-1">Recommended timeframe: 1-2 weeks</p>
                            </div>
                            <a href={item.resource} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                Official Docs
                            </a>
                        </div>
                    ))}
                    {studyPlan.study_plan.length === 0 && (
                        <div className="p-6 text-center text-secondary border border-border rounded-xl">
                            No missing skills identified!
                        </div>
                    )}
                </div>
            </div>
        );
      default:
        return (
          <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-surface">
            <p className="text-secondary">Coming Soon: [{activeTab}]</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen text-primary selection:bg-primary selection:text-background font-sans">
      {renderNav()}
      <main className="ml-64 flex-1 p-12 overflow-y-auto h-screen bg-background">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
