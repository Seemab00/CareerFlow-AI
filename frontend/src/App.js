import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { 
  auth, db, doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, deleteDoc, Timestamp,
  loginUser, registerUser, logoutUser,
  postJob, deleteJob, listenToJobs, listenToHirerJobs, listenToApplications,
  applyForJob, saveMeeting, getCandidateProfile, saveCandidateProfile, getApplicationsByCandidate,
  saveJobForLater, getSavedJobs, removeSavedJob, changePassword, getAllCandidates,
  withdrawApplication
} from './firebase';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User logged in:', user.email, 'UID:', user.uid);
        if (user.email === 'seemabmalik2005@gmail.com') {
          setUserRole('hirer');
          setCurrentUser({ uid: user.uid, email: user.email, name: 'Simaab Malik', role: 'hirer' });
          setLoggedIn(true);
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setUserRole(userData?.role);
          setCurrentUser({ uid: user.uid, email: user.email, name: userData?.name, role: userData?.role });
          setLoggedIn(true);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser(loginEmail, loginPassword);
    if (result.success) {
      setMessage('✅ Login successful!');
    } else {
      setMessage('❌ Login failed: ' + result.error);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await registerUser(regEmail, regPassword, regName, 'candidate');
    if (result.success) {
      setMessage('✅ Registration successful! You can now login');
      setIsLogin(true);
    } else {
      setMessage('❌ Registration failed: ' + result.error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setLoggedIn(false);
    setUserRole(null);
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="loading-container"><div className="loader"></div><p>Loading...</p></div>;
  }

  if (loggedIn && userRole === 'hirer') {
    return <HirerDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (loggedIn && userRole === 'candidate') {
    return <CandidateDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="app-container">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🚀 CareerFlow AI</h1>
          <p>AI-Powered Job Portal & Meeting Assistant</p>
        </div>
        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Login</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Register</button>
        </div>
        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group"><label>Email</label><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Password</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
            <button type="submit" className="btn-primary">Login</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group"><label>Full Name</label><input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Password</label><input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required /></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required /></div>
            <button type="submit" className="btn-primary">Register</button>
          </form>
        )}
        {message && <div className="message">{message}</div>}
        <div className="demo-info"><p><strong>Hirer Login:</strong> seemabmalik2005@gmail.com</p></div>
      </div>
    </div>
  );
}

// ========== ABOUT US ==========
function AboutUs() {
  return (
    <div className="about-us">
      <h2>📖 About CareerFlow AI</h2>
      <div className="about-content">
        <p><strong>CareerFlow AI</strong> is an AI-powered job portal that connects talented candidates with forward-thinking employers.</p>
        <h3>🎯 Our Mission</h3>
        <p>To revolutionize the hiring process by leveraging artificial intelligence.</p>
        <h3>✨ What We Offer</h3>
        <ul><li>AI-powered job matching</li><li>Smart CV analysis</li><li>Automated interview scheduling</li><li>AI meeting summaries</li></ul>
        <h3>🤖 Our Technology</h3>
        <p>Powered by Groq LLaMA and Google Gemini AI.</p>
      </div>
    </div>
  );
}

// ========== MEETING ASSISTANT WITH SCHEDULING & AUTO EMAIL ==========
function MeetingAssistant({ currentUser }) {
  const [transcript, setTranscript] = useState('');
  const [topic, setTopic] = useState('');
  const [attendees, setAttendees] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('60');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [scheduledMeeting, setScheduledMeeting] = useState(null);

  // Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.onstart = () => { setIsRecording(true); setMessage('🎙️ Recording... Speak clearly'); };
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };
      recognitionInstance.onend = () => { setIsRecording(false); setMessage('✅ Recording stopped'); };
      setRecognition(recognitionInstance);
    } else {
      setMessage('❌ Speech recognition not supported in this browser');
    }
  }, []);

  const startRecording = () => { if (recognition) recognition.start(); };
  const stopRecording = () => { if (recognition) recognition.stop(); };

  // Schedule Meeting with Auto Email
  const scheduleMeeting = async () => {
    if (!topic) {
      setMessage('❌ Please enter meeting topic');
      return;
    }
    if (!meetingDate || !meetingTime) {
      setMessage('❌ Please select meeting date and time');
      return;
    }
    
    setLoading(true);
    setMessage('📅 Scheduling meeting...');
    
    try {
      // Step 1: Schedule meeting and get Meet link
      const response = await axios.post('http://localhost:5000/api/schedule-meeting', {
        topic: topic,
        date: meetingDate,
        time: meetingTime,
        duration: parseInt(meetingDuration),
        attendees: attendees,
        organizerEmail: currentUser?.email,
        description: meetingDescription || `Meeting discussion for ${topic}`
      });
      
      setScheduledMeeting(response.data);
      setMessage('✅ Meeting scheduled! Sending invitations...');
      
      // Step 2: Send email invitations to all attendees
      const attendeeList = attendees.split(',').map(email => email.trim()).filter(email => email);
      
      for (const attendeeEmail of attendeeList) {
        const candidateName = attendeeEmail.split('@')[0];
        try {
          await axios.post('http://localhost:5000/api/send-meeting-invite', {
            to: attendeeEmail,
            candidateName: candidateName,
            topic: topic,
            date: meetingDate,
            time: meetingTime,
            meetLink: response.data.meetLink,
            calendarLink: response.data.calendarLink,
            organizerName: currentUser?.name || 'Hirer'
          });
          console.log(`Invitation sent to ${attendeeEmail}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${attendeeEmail}:`, emailError);
        }
      }
      
      setMessage(`✅ Meeting scheduled! Invitations sent to ${attendeeList.length} attendee(s).`);
      
      // Auto-fill transcript with meeting info
      setTranscript(`Meeting: ${topic}\nDate: ${meetingDate}\nTime: ${meetingTime}\nAttendees: ${attendees}\n\n[Meeting transcript will appear here...]`);
      
    } catch (error) {
      setMessage('❌ Failed to schedule meeting: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Generate AI Summary
  const generateSummary = async () => {
    if (!transcript) {
      setMessage('❌ Please add meeting transcript or record audio');
      return;
    }
    
    setLoading(true);
    setMessage('🤖 AI is generating meeting summary with Groq...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/groq/summary', {
        transcript,
        topic: topic || 'General Meeting',
        attendees: attendees || 'Team Members'
      });
      
      setSummary(response.data);
      
      // Save to Firebase
      await saveMeeting({
        topic,
        attendees,
        meetingDate,
        meetingTime,
        meetLink: scheduledMeeting?.meetLink,
        summary: response.data,
        transcript,
        organizerId: currentUser?.uid,
        organizerName: currentUser?.name
      });
      
      setMessage('✅ AI summary generated and saved!');
    } catch (error) {
      console.error('Groq API error:', error);
      setMessage('❌ Failed to generate summary');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

const downloadSummary = () => {
  let content = `INTERVIEW MEETING SUMMARY\n`;
  content += `=====================================\n\n`;
  
  if (summary.basic_info) {
    content += `📅 BASIC INFORMATION\n`;
    content += `Position: ${summary.basic_info.topic}\n`;
    content += `Interviewer: ${summary.basic_info.interviewer}\n`;
    content += `Candidate: ${summary.basic_info.candidate}\n`;
    content += `Duration: ${summary.basic_info.duration}\n\n`;
  }
  
  content += `🎯 KEY DISCUSSION POINTS\n`;
  summary.key_points?.forEach(p => content += `• ${p}\n`);
  content += `\n`;
  
  if (summary.evaluation) {
    content += `⭐ CANDIDATE EVALUATION\n`;
    content += `Strengths:\n`;
    summary.evaluation.strengths?.forEach(s => content += `  ✓ ${s}\n`);
    content += `Areas for Improvement:\n`;
    summary.evaluation.weaknesses?.forEach(w => content += `  ✗ ${w}\n`);
    content += `\nRatings:\n`;
    content += `  Technical: ${summary.evaluation.technical_rating}/5\n`;
    content += `  Communication: ${summary.evaluation.communication_rating}/5\n`;
    content += `  Cultural Fit: ${summary.evaluation.cultural_fit_rating}/5\n`;
    content += `  Overall: ${summary.evaluation.overall_rating}/5\n\n`;
  }
  
  if (summary.q_and_a) {
    content += `📝 QUESTIONS & ANSWERS\n`;
    summary.q_and_a.forEach((qa, i) => {
      content += `\nQ${i+1}: ${qa.question}\n`;
      content += `A: ${qa.answer}\n`;
      content += `Rating: ${qa.rating}\n`;
    });
    content += `\n`;
  }
  
  if (summary.decision) {
    content += `🎯 DECISION\n`;
    content += `Status: ${summary.decision.status}\n`;
    content += `Reason: ${summary.decision.reason}\n`;
    content += `Priority: ${summary.decision.priority}\n\n`;
  }
  
  if (summary.next_steps) {
    content += `📌 NEXT STEPS\n`;
    summary.next_steps.forEach(step => content += `• ${step}\n`);
    content += `\n`;
  }
  
  if (summary.action_items) {
    content += `✅ ACTION ITEMS\n`;
    summary.action_items.forEach(item => {
      content += `• ${item.task} → ${item.assignee} (Due: ${item.deadline})\n`;
    });
    content += `\n`;
  }
  
  if (summary.recommendation) {
    content += `🤖 AI RECOMMENDATION\n`;
    content += `Match Score: ${summary.recommendation.match_score}%\n`;
    content += `Verdict: ${summary.recommendation.verdict}\n`;
    content += `Notes: ${summary.recommendation.notes}\n\n`;
  }
  
  content += `---\nGenerated by CareerFlow AI - Groq LLaMA 3.3\n`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-summary-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

  return (
    <div className="meeting-assistant">
      <h2>🎙️ AI Meeting Assistant (Powered by Groq)</h2>
      
      {/* Meeting Scheduling Section */}
      <div className="schedule-section">
        <h3>📅 Schedule a Meeting</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Meeting Topic *</label>
            <input type="text" placeholder="e.g., Weekly Sprint Planning, Client Meeting" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Attendees (emails, comma separated)</label>
            <input type="text" placeholder="ali@example.com, sara@example.com" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Meeting Date *</label>
            <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Meeting Time *</label>
            <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <select value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)}>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Meeting Description (Optional)</label>
          <textarea rows="2" placeholder="Agenda, goals, what to discuss..." value={meetingDescription} onChange={(e) => setMeetingDescription(e.target.value)} />
        </div>
        <button onClick={scheduleMeeting} className="btn-schedule" disabled={loading}>
          {loading ? '⏳ Scheduling...' : '📅 Schedule Meeting & Send Invites'}
        </button>
        
        {/* Scheduled Meeting Info WITH EMAIL STATUS */}
        {scheduledMeeting && (
          <div className="scheduled-info">
            <h4>✅ Meeting Scheduled!</h4>
            <p><strong>🔗 Google Meet Link:</strong> <a href={scheduledMeeting.meetLink} target="_blank" rel="noopener noreferrer">{scheduledMeeting.meetLink}</a></p>
            <p><strong>📅 Calendar Link:</strong> <a href={scheduledMeeting.calendarLink} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a></p>
            
            {/* EMAIL STATUS SECTION - YAHAN ADD HUA HAI */}
            <div className="email-status">
              <p><strong>📧 Email Invitations Sent To:</strong></p>
              <ul>
                {attendees.split(',').map((email, i) => (
                  <li key={i}>{email.trim()}</li>
                ))}
              </ul>
            </div>
            
            <button onClick={() => {
              navigator.clipboard.writeText(scheduledMeeting.meetLink);
              setMessage('✅ Meet link copied to clipboard!');
              setTimeout(() => setMessage(''), 2000);
            }} className="btn-copy">📋 Copy Meet Link</button>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Voice Recording Section */}
      <div className="recording-section">
        <h3>🎤 Voice Recording (Real-time Transcription)</h3>
        <div className="recording-controls">
          <button onClick={startRecording} disabled={isRecording} className="btn-record">🎤 Start Recording</button>
          <button onClick={stopRecording} disabled={!isRecording} className="btn-stop">⏹️ Stop Recording</button>
        </div>
      </div>

      {/* Transcript Section */}
      <div className="form-group">
        <label>Meeting Transcript / Notes</label>
        <textarea rows="8" placeholder="Meeting transcript will appear here... or paste your notes" value={transcript} onChange={(e) => setTranscript(e.target.value)} />
      </div>

      {/* Generate Summary Button */}
      <button onClick={generateSummary} disabled={loading} className="btn-primary">
        {loading ? '⏳ Generating Summary...' : '✨ Generate AI Summary with Groq'}
      </button>

      {message && <div className="message">{message}</div>}

      {/* AI Summary Results - Interview Format */}
{summary && (
  <div className="summary-result">
    <h3>📋 Interview Meeting Summary</h3>
    
    {/* Basic Info */}
    {summary.basic_info && (
      <div className="summary-section">
        <h4>📅 Basic Information</h4>
        <p><strong>Position:</strong> {summary.basic_info.topic}</p>
        <p><strong>Interviewer:</strong> {summary.basic_info.interviewer}</p>
        <p><strong>Candidate:</strong> {summary.basic_info.candidate}</p>
        <p><strong>Duration:</strong> {summary.basic_info.duration}</p>
      </div>
    )}
    
    {/* Key Points */}
    <div className="summary-section">
      <h4>🎯 Key Discussion Points</h4>
      <ul>{summary.key_points?.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </div>
    
    {/* Candidate Evaluation */}
    {summary.evaluation && (
      <div className="summary-section">
        <h4>⭐ Candidate Evaluation</h4>
        <div className="evaluation-grid">
          <div className="strengths">
            <strong>✅ Strengths:</strong>
            <ul>{summary.evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="weaknesses">
            <strong>⚠️ Areas for Improvement:</strong>
            <ul>{summary.evaluation.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        </div>
        <div className="ratings">
          <div><strong>Technical:</strong> {'⭐'.repeat(Math.floor(summary.evaluation.technical_rating || 0))}{'☆'.repeat(5 - Math.floor(summary.evaluation.technical_rating || 0))} ({summary.evaluation.technical_rating}/5)</div>
          <div><strong>Communication:</strong> {'⭐'.repeat(Math.floor(summary.evaluation.communication_rating || 0))}{'☆'.repeat(5 - Math.floor(summary.evaluation.communication_rating || 0))} ({summary.evaluation.communication_rating}/5)</div>
          <div><strong>Cultural Fit:</strong> {'⭐'.repeat(Math.floor(summary.evaluation.cultural_fit_rating || 0))}{'☆'.repeat(5 - Math.floor(summary.evaluation.cultural_fit_rating || 0))} ({summary.evaluation.cultural_fit_rating}/5)</div>
          <div><strong>Overall Rating:</strong> {'⭐'.repeat(Math.floor(summary.evaluation.overall_rating || 0))}{'☆'.repeat(5 - Math.floor(summary.evaluation.overall_rating || 0))} ({summary.evaluation.overall_rating}/5)</div>
        </div>
      </div>
    )}
    
    {/* Technical Assessment */}
    {summary.technical_assessment && (
      <div className="summary-section">
        <h4>💻 Technical Assessment</h4>
        <p><strong>Programming Languages:</strong> {summary.technical_assessment.programming_languages?.join(', ')}</p>
        <p><strong>Frameworks:</strong> {summary.technical_assessment.frameworks?.join(', ')}</p>
        <p><strong>Problem Solving:</strong> {summary.technical_assessment.problem_solving}</p>
        <p><strong>Portfolio Quality:</strong> {summary.technical_assessment.portfolio_quality}</p>
      </div>
    )}
    
    {/* Q&A */}
    {summary.q_and_a && summary.q_and_a.length > 0 && (
      <div className="summary-section">
        <h4>📝 Questions & Answers</h4>
        {summary.q_and_a.map((qa, i) => (
          <div key={i} className="qa-item">
            <div><strong>Q{i+1}:</strong> {qa.question}</div>
            <div><strong>A:</strong> {qa.answer}</div>
            <div><strong>Rating:</strong> <span className={`rating-${qa.rating?.toLowerCase()}`}>{qa.rating}</span></div>
          </div>
        ))}
      </div>
    )}
    
    {/* Decision */}
    {summary.decision && (
      <div className="summary-section decision-section">
        <h4>🎯 Decision</h4>
        <div className={`decision-badge status-${summary.decision.status?.toLowerCase()}`}>
          {summary.decision.status === 'Shortlist' ? '✅ SHORTLISTED' : summary.decision.status === 'Reject' ? '❌ REJECTED' : '⏸️ ON HOLD'}
        </div>
        <p><strong>Reason:</strong> {summary.decision.reason}</p>
        <p><strong>Priority:</strong> <span className={`priority-${summary.decision.priority?.toLowerCase()}`}>{summary.decision.priority}</span></p>
      </div>
    )}
    
    {/* Next Steps */}
    {summary.next_steps && summary.next_steps.length > 0 && (
      <div className="summary-section">
        <h4>📌 Next Steps</h4>
        <ul>{summary.next_steps.map((step, i) => <li key={i}>{step}</li>)}</ul>
      </div>
    )}
    
    {/* Action Items */}
    {summary.action_items && summary.action_items.length > 0 && (
      <div className="summary-section">
        <h4>✅ Action Items</h4>
        {summary.action_items.map((item, i) => (
          <div key={i} className="action-item">
            📋 {item.task} → <strong>{item.assignee}</strong> (Due: {item.deadline})
          </div>
        ))}
      </div>
    )}
    
    {/* AI Recommendation */}
    {summary.recommendation && (
      <div className="summary-section recommendation">
        <h4>🤖 AI Recommendation</h4>
        <div className="match-score-large">📊 Match Score: {summary.recommendation.match_score}%</div>
        <p><strong>Verdict:</strong> {summary.recommendation.verdict}</p>
        <p><strong>Notes:</strong> {summary.recommendation.notes}</p>
      </div>
    )}
    
    {/* Interviewer Notes */}
    {summary.interviewer_notes && (
      <div className="summary-section">
        <h4>📝 Interviewer Notes</h4>
        <p>{summary.interviewer_notes}</p>
      </div>
    )}
    
    <button onClick={downloadSummary} className="btn-download">
      📥 Download Summary
    </button>
  </div>
)}
    </div>
  );
}

// ========== HIRER DASHBOARD - COMPLETE WITH REJECTION MODAL ==========
function HirerDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('post-job');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editJobData, setEditJobData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
  const [candidateFilters, setCandidateFilters] = useState({ skill: '', location: '', minExperience: '' });
  
  // ========== REJECTION MODAL STATES ==========
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFeedback, setRejectFeedback] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ jobs: 0, applications: 0, interviews: 0, shortlisted: 0 });
  
  // Post Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobExperience, setJobExperience] = useState('');
  const [jobType, setJobType] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Company Profile
  const [companyProfile, setCompanyProfile] = useState({
    name: 'CareerFlow AI', industry: 'Technology', website: 'https://careerflow.ai', email: currentUser?.email || '', phone: '+92 300 1234567', address: 'Karachi, Pakistan', description: 'AI-powered job portal'
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyMessage, setCompanyMessage] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = listenToHirerJobs(currentUser.uid, (fetchedJobs) => {
      setJobs(fetchedJobs);
      setStats(prev => ({ ...prev, jobs: fetchedJobs.length }));
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'companies', currentUser.uid));
      if (docSnap.exists()) setCompanyProfile(docSnap.data());
    } catch (error) { console.error(error); }
  };

  const saveCompanyProfile = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'companies', currentUser.uid), { ...companyProfile, updatedAt: Timestamp.now() });
      setCompanyMessage('✅ Company profile saved!');
    } catch (error) { setCompanyMessage('❌ Failed to save'); }
    setLoading(false);
    setTimeout(() => setCompanyMessage(''), 3000);
  };

  const generateDescription = async () => {
    if (!jobTitle) { setMessage('❌ Please enter job title first'); return; }
    setGeneratingDesc(true);
    setMessage('🤖 AI is generating job description...');
    try {
      const response = await axios.post('http://localhost:5000/api/groq/generate-description', { title: jobTitle, skills: jobSkills });
      setJobDescription(response.data.description);
      setMessage('✅ Job description generated!');
    } catch (error) { setMessage('❌ Failed to generate description'); }
    setGeneratingDesc(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await postJob({ title: jobTitle, description: jobDescription, skills: jobSkills.split(',').map(s => s.trim()), location: jobLocation, salary: jobSalary, experience: jobExperience, type: jobType }, currentUser.uid, currentUser.name);
    if (result.success) {
      setMessage('✅ Job posted!');
      setJobTitle(''); setJobDescription(''); setJobSkills(''); setJobLocation(''); setJobSalary(''); setJobExperience(''); setJobType('');
    } else { setMessage('❌ Failed: ' + result.error); }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (window.confirm(`Delete "${jobTitle}"?`)) {
      const result = await deleteJob(jobId);
      setMessage(result.success ? '✅ Job deleted!' : '❌ Delete failed');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setEditJobData({
      title: job.title, description: job.description, skills: job.skills?.join(', '),
      location: job.location, salary: job.salary, experience: job.experience, type: job.type
    });
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'jobs', editingJob.id), {
        title: editJobData.title, description: editJobData.description,
        skills: editJobData.skills.split(',').map(s => s.trim()), location: editJobData.location,
        salary: editJobData.salary, experience: editJobData.experience, type: editJobData.type, updatedAt: Timestamp.now()
      });
      setMessage('✅ Job updated!');
      setEditingJob(null);
    } catch (error) { setMessage('❌ Failed to update'); }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const viewApplications = (job) => {
    setSelectedJob(job);
    const unsubscribe = listenToApplications(job.id, (fetchedApps) => {
      setApplications(fetchedApps);
      const interviewCount = fetchedApps.filter(a => a.status === 'interview').length;
      setStats(prev => ({ ...prev, applications: fetchedApps.length, interviews: interviewCount }));
    });
    return () => unsubscribe();
  };

  // ========== UPDATE APPLICATION STATUS WITH EMAIL ==========
  const updateApplicationStatus = async (appId, newStatus, candidateEmail, candidateName, jobTitle) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus });
      setMessage(`✅ Status updated to ${newStatus}`);
      
      // Send email notification for non-reject statuses
      if (newStatus !== 'rejected') {
        try {
          await axios.post('http://localhost:5000/api/send-job-status', {
            to: candidateEmail,
            candidateName: candidateName,
            jobTitle: jobTitle,
            status: newStatus,
            companyName: companyProfile.name || 'CareerFlow AI'
          });
          setMessage(`✅ Status updated and email sent to ${candidateName}`);
        } catch (emailError) {
          console.error('Email send failed:', emailError);
        }
      }
      
      if (newStatus === 'interview') {
        setShowScheduleModal({ appId, candidateEmail, candidateName, jobTitle });
      }
    } catch (error) { 
      setMessage('❌ Failed to update status'); 
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // ========== REJECT CANDIDATE WITH REASON ==========
  const handleRejectCandidate = async () => {
    setLoading(true);
    try {
      // Send rejection email
      await axios.post('http://localhost:5000/api/send-job-status', {
        to: showRejectModal.candidateEmail,
        candidateName: showRejectModal.candidateName,
        jobTitle: showRejectModal.jobTitle,
        status: 'rejected',
        reason: rejectReason,
        feedback: rejectFeedback,
        companyName: companyProfile.name || 'CareerFlow AI'
      });
      
      // Update status in Firebase
      await updateDoc(doc(db, 'applications', showRejectModal.appId), { 
        status: 'rejected',
        rejectionReason: rejectReason,
        rejectionFeedback: rejectFeedback
      });
      
      setMessage(`✅ Candidate rejected and email sent to ${showRejectModal.candidateName}`);
      setShowRejectModal(null);
      setRejectReason('');
      setRejectFeedback('');
      
      // Refresh applications
      if (selectedJob) {
        viewApplications(selectedJob);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      setMessage('❌ Failed to reject candidate');
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // ========== SCHEDULE INTERVIEW ==========
  const scheduleInterview = async (appId, candidateEmail, candidateName, jobTitle) => {
    if (!scheduleData.date || !scheduleData.time) {
      setMessage('❌ Please select date and time');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/schedule-interview', {
        candidateName,
        candidateEmail,
        jobTitle,
        date: scheduleData.date,
        time: scheduleData.time,
        interviewerEmail: currentUser.email
      });
      
      await updateDoc(doc(db, 'applications', appId), {
        status: 'interview',
        interviewDate: scheduleData.date,
        interviewTime: scheduleData.time,
        meetLink: response.data.meetLink
      });
      
      setMessage(`✅ Interview scheduled! Meet link: ${response.data.meetLink}`);
      setShowScheduleModal(null);
      setScheduleData({ date: '', time: '' });
      
      if (selectedJob) {
        viewApplications(selectedJob);
      }
    } catch (error) {
      console.error('Schedule error:', error);
      setMessage('❌ Failed to schedule interview');
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordMessage('❌ Passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { setPasswordMessage('❌ Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await changePassword(passwordData.oldPassword, passwordData.newPassword);
    setPasswordMessage(result.success ? '✅ Password changed!' : '❌ Failed: ' + result.error);
    if (result.success) setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setLoading(false);
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSkill = !candidateFilters.skill || app.skills?.some(s => s.toLowerCase().includes(candidateFilters.skill.toLowerCase()));
    const matchesLocation = !candidateFilters.location || app.city?.toLowerCase().includes(candidateFilters.location.toLowerCase());
    const matchesExp = !candidateFilters.minExperience || (parseInt(app.experience) || 0) >= parseInt(candidateFilters.minExperience);
    return matchesSkill && matchesLocation && matchesExp;
  });

  const getApplicationStats = (jobId) => {
    const jobApps = applications.filter(a => a.jobId === jobId);
    return { total: jobApps.length, pending: jobApps.filter(a => a.status === 'pending').length, interview: jobApps.filter(a => a.status === 'interview').length, shortlisted: jobApps.filter(a => a.status === 'shortlisted').length };
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
  <h1>👔 Hirer Dashboard</h1>
  <div className="header-info">
    <span>Welcome, {currentUser?.name}</span>
    <button onClick={async () => {
      const response = await axios.get('http://localhost:5000/api/auth/google/url');
      window.location.href = response.data.url;
    }} className="btn-google">
      🔗 Connect Google Calendar
    </button>
    <button onClick={() => setShowCompanyModal(true)} className="btn-company" title="Company Profile">🏢 Company</button>
    <button onClick={() => setShowSettings(true)} className="btn-settings" title="Settings">⚙️ Settings</button>
    <button onClick={onLogout} className="btn-logout">Logout</button>
  </div>
</div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{stats.jobs}</div><div className="stat-label">Total Jobs</div></div>
        <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-value">{stats.applications}</div><div className="stat-label">Applications</div></div>
        <div className="stat-card"><div className="stat-icon">🎙️</div><div className="stat-value">{stats.interviews}</div><div className="stat-label">Interviews</div></div>
        <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-value">{stats.shortlisted}</div><div className="stat-label">Shortlisted</div></div>
      </div>

      <div className="dashboard-tabs">
        <button className={activeTab === 'post-job' ? 'active' : ''} onClick={() => setActiveTab('post-job')}>📝 Post Job</button>
        <button className={activeTab === 'my-jobs' ? 'active' : ''} onClick={() => setActiveTab('my-jobs')}>📋 My Jobs ({jobs.length})</button>
        <button className={activeTab === 'meetings' ? 'active' : ''} onClick={() => setActiveTab('meetings')}>🎙️ Meeting Assistant</button>
        <button className={activeTab === 'about' ? 'active' : ''} onClick={() => setActiveTab('about')}>📖 About Us</button>
      </div>

      {activeTab === 'post-job' && (
        <div className="post-job-form">
          <h2>📝 Post a New Job</h2>
          <form onSubmit={handlePostJob}>
            <div className="form-row"><div className="form-group"><label>Job Title *</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required /></div>
            <div className="form-group"><label>Location *</label><select value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} required><option value="">Select</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></div></div>
            <div className="form-row"><div className="form-group"><label>Job Type</label><select value={jobType} onChange={(e) => setJobType(e.target.value)}><option value="">Select</option><option value="fulltime">Full Time</option><option value="parttime">Part Time</option></select></div>
            <div className="form-group"><label>Salary Range</label><input type="text" placeholder="$60,000 - $80,000" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} /></div></div>
            <div className="form-group"><label>Job Description *</label><textarea rows="5" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />
            <button type="button" onClick={generateDescription} className="btn-ai" disabled={generatingDesc}>{generatingDesc ? '⏳ Generating...' : '🤖 AI Generate Description'}</button></div>
            <div className="form-row"><div className="form-group"><label>Required Skills * (comma separated)</label><input type="text" placeholder="React, Node.js" value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} required /></div>
            <div className="form-group"><label>Experience Required</label><input type="text" placeholder="3-5 years" value={jobExperience} onChange={(e) => setJobExperience(e.target.value)} /></div></div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting...' : '📌 Post Job'}</button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      )}

      {activeTab === 'my-jobs' && (
        <div className="my-jobs">
          <h2>📋 Your Posted Jobs</h2>
          {jobs.length === 0 ? <div className="empty-state">No jobs posted yet.</div> : jobs.map(job => {
            const appStats = getApplicationStats(job.id);
            return <div key={job.id} className="job-card"><div className="job-header"><h3>{job.title}</h3><span className={`job-location ${job.location}`}>{job.location}</span></div>
            <div className="job-stats-mini"><span>📝 {appStats.total} Apps</span><span>🎙️ {appStats.interview} Interviews</span></div>
            <div className="job-skills">{job.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
            <div className="job-actions"><button onClick={() => viewApplications(job)} className="btn-secondary">👥 View Applications</button>
            <button onClick={() => handleEditJob(job)} className="btn-edit">✏️ Edit</button>
            <button onClick={() => handleDeleteJob(job.id, job.title)} className="btn-delete">🗑️ Delete</button></div></div>;
          })}
        </div>
      )}

      {activeTab === 'meetings' && <MeetingAssistant currentUser={currentUser} />}
      {activeTab === 'about' && <AboutUs />}

      {selectedJob && (
        <div className="applications-management">
          <div className="back-button">
            <button onClick={() => { setSelectedJob(null); setApplications([]); }} className="btn-back">
              ← Back to Jobs
            </button>
            <h3>Applications for "{selectedJob.title}"</h3>
          </div>
          
          <div className="filter-row">
            <input type="text" placeholder="Filter by skill..." value={candidateFilters.skill} onChange={(e) => setCandidateFilters({...candidateFilters, skill: e.target.value})} className="filter-input" />
            <input type="text" placeholder="Filter by location..." value={candidateFilters.location} onChange={(e) => setCandidateFilters({...candidateFilters, location: e.target.value})} className="filter-input" />
            <input type="number" placeholder="Min experience" value={candidateFilters.minExperience} onChange={(e) => setCandidateFilters({...candidateFilters, minExperience: e.target.value})} className="filter-input" />
          </div>
          
          <div className="candidates-list">
            {filteredApplications.length === 0 ? (
              <div className="empty-state">No applications found.</div>
            ) : (
              filteredApplications.map((app, idx) => (
                <div key={idx} className="candidate-card">
                  <div className="candidate-header">
                    <div className="candidate-info">
                      <strong>{app.candidateName}</strong>
                      <span className="match-badge" style={{background: app.matchScore > 80 ? '#22c55e' : app.matchScore > 60 ? '#f59e0b' : '#ef4444'}}>
                        {app.matchScore}% Match
                      </span>
                    </div>
                    <div className="candidate-status">
                      Status: 
                      <select 
                        value={app.status} 
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'rejected') {
                            setShowRejectModal({
                              appId: app.id,
                              candidateEmail: app.candidateEmail,
                              candidateName: app.candidateName,
                              jobTitle: selectedJob.title
                            });
                          } else {
                            updateApplicationStatus(app.id, newStatus, app.candidateEmail, app.candidateName, selectedJob.title);
                          }
                        }} 
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </div>
                  </div>
                  <div className="candidate-details">
                    <div>📧 {app.candidateEmail}</div>
                    <div>📍 {app.city || 'Not specified'}</div>
                    <div>📅 Experience: {app.experience || 'Not specified'} years</div>
                    <div>🔧 Skills: {app.skills?.join(', ') || 'Not specified'}</div>
                  </div>
                  
                  <div className="interview-actions">
                    {app.status === 'interview' && app.meetLink ? (
                      <a href={app.meetLink} target="_blank" rel="noopener noreferrer" className="btn-meet">
                        🎥 Join Google Meet
                      </a>
                    ) : (
                      <button 
                        onClick={() => {
                          setShowScheduleModal({
                            appId: app.id,
                            candidateEmail: app.candidateEmail,
                            candidateName: app.candidateName,
                            jobTitle: selectedJob.title,
                            application: app
                          });
                        }} 
                        className="btn-schedule-interview"
                      >
                        📅 Schedule Interview
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {editingJob && (<div className="modal-overlay" onClick={() => setEditingJob(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><h3>✏️ Edit Job</h3>
        <div className="form-group"><label>Job Title</label><input type="text" value={editJobData.title} onChange={(e) => setEditJobData({...editJobData, title: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea rows="4" value={editJobData.description} onChange={(e) => setEditJobData({...editJobData, description: e.target.value})} /></div>
        <div className="form-row"><div className="form-group"><label>Skills</label><input type="text" value={editJobData.skills} onChange={(e) => setEditJobData({...editJobData, skills: e.target.value})} /></div>
        <div className="form-group"><label>Location</label><select value={editJobData.location} onChange={(e) => setEditJobData({...editJobData, location: e.target.value})}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></div></div>
        <div className="form-row"><div className="form-group"><label>Salary</label><input type="text" value={editJobData.salary} onChange={(e) => setEditJobData({...editJobData, salary: e.target.value})} /></div>
        <div className="form-group"><label>Type</label><select value={editJobData.type} onChange={(e) => setEditJobData({...editJobData, type: e.target.value})}><option value="fulltime">Full Time</option><option value="parttime">Part Time</option></select></div></div>
        <div className="modal-actions"><button onClick={handleSaveEdit} className="btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button><button onClick={() => setEditingJob(null)} className="btn-secondary">Cancel</button></div></div></div>)}

      {showScheduleModal && (<div className="modal-overlay" onClick={() => setShowScheduleModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><h3>📅 Schedule Interview</h3>
        <p><strong>Candidate:</strong> {showScheduleModal.candidateName}</p><p><strong>Job:</strong> {showScheduleModal.jobTitle}</p>
        <div className="form-group"><label>Date</label><input type="date" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} /></div>
        <div className="form-group"><label>Time</label><input type="time" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} /></div>
        <div className="modal-actions"><button onClick={() => scheduleInterview(showScheduleModal.appId, showScheduleModal.candidateEmail, showScheduleModal.candidateName, showScheduleModal.jobTitle)} className="btn-primary">{loading ? 'Scheduling...' : 'Schedule'}</button>
        <button onClick={() => setShowScheduleModal(null)} className="btn-secondary">Cancel</button></div></div></div>)}

      {/* ========== REJECTION MODAL ========== */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>❌ Reject Candidate</h3>
            <p><strong>Candidate:</strong> {showRejectModal.candidateName}</p>
            <p><strong>Job:</strong> {showRejectModal.jobTitle}</p>
            
            <div className="form-group">
              <label>Reason for Rejection (Optional)</label>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                <option value="">Select a reason</option>
                <option value="Skills mismatch">Skills mismatch</option>
                <option value="Experience level not sufficient">Experience level not sufficient</option>
                <option value="Budget constraints">Budget constraints</option>
                <option value="Better qualified candidate found">Better qualified candidate found</option>
                <option value="Position on hold">Position on hold</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Feedback for Candidate (Optional)</label>
              <textarea 
                rows="3" 
                placeholder="Provide constructive feedback..." 
                value={rejectFeedback} 
                onChange={(e) => setRejectFeedback(e.target.value)}
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={handleRejectCandidate} className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Rejection Email'}
              </button>
              <button onClick={() => setShowRejectModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (<div className="modal-overlay" onClick={() => setShowSettings(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><h3>⚙️ Settings</h3><h4>Change Password</h4>
        <div className="form-group"><label>Current Password</label><input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} /></div>
        <div className="form-group"><label>New Password</label><input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} /></div>
        <div className="form-group"><label>Confirm Password</label><input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div>
        <button onClick={handleChangePassword} className="btn-primary">{loading ? 'Changing...' : 'Change Password'}</button>
        {passwordMessage && <div className="message">{passwordMessage}</div>}<button onClick={() => setShowSettings(false)} className="btn-secondary" style={{marginTop: '10px'}}>Close</button></div></div>)}

      {showCompanyModal && (<div className="modal-overlay" onClick={() => setShowCompanyModal(false)}><div className="modal-content company-modal" onClick={(e) => e.stopPropagation()}><h3>🏢 Company Profile</h3>
        <div className="form-group"><label>Company Name</label><input type="text" value={companyProfile.name} onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})} /></div>
        <div className="form-group"><label>Industry</label><input type="text" value={companyProfile.industry} onChange={(e) => setCompanyProfile({...companyProfile, industry: e.target.value})} /></div>
        <div className="form-group"><label>Website</label><input type="url" value={companyProfile.website} onChange={(e) => setCompanyProfile({...companyProfile, website: e.target.value})} /></div>
        <div className="form-group"><label>Email</label><input type="email" value={companyProfile.email} onChange={(e) => setCompanyProfile({...companyProfile, email: e.target.value})} /></div>
        <div className="form-group"><label>Phone</label><input type="tel" value={companyProfile.phone} onChange={(e) => setCompanyProfile({...companyProfile, phone: e.target.value})} /></div>
        <div className="form-group"><label>Address</label><input type="text" value={companyProfile.address} onChange={(e) => setCompanyProfile({...companyProfile, address: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea rows="3" value={companyProfile.description} onChange={(e) => setCompanyProfile({...companyProfile, description: e.target.value})} /></div>
        <div className="modal-actions"><button onClick={saveCompanyProfile} className="btn-primary">{loading ? 'Saving...' : 'Save Profile'}</button><button onClick={() => setShowCompanyModal(false)} className="btn-secondary">Close</button></div>
        {companyMessage && <div className="message">{companyMessage}</div>}</div></div>)}

      {message && <div className="message">{message}</div>}
    </div>
  );
}

// ========== CANDIDATE DASHBOARD ==========
function CandidateDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ location: '', type: '', sortBy: 'date' });
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [stats, setStats] = useState({ applied: 0, interviews: 0, matchRate: 0, profileStrength: 0 });
  
  const [profile, setProfile] = useState({
    name: currentUser?.name || '', email: currentUser?.email || '', age: '', city: '', phone: '',
    education: '', university: '', experience: '', skills: ''
  });
  const [uploadedCV, setUploadedCV] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { const unsubscribe = listenToJobs(setJobs); return () => unsubscribe(); }, []);
  useEffect(() => { loadSavedJobs(); }, []);
  useEffect(() => { loadApplications(); }, []);
  useEffect(() => { loadProfile(); }, []);

  // Email alerts every 12 hours
  useEffect(() => {
    const sendJobAlerts = async () => {
      if (!profile.skills || !jobs.length) return;
      const candidateSkills = profile.skills.toLowerCase().split(',').map(s => s.trim());
      const matchingJobs = jobs.filter(job => job.skills?.some(skill => candidateSkills.some(cs => skill.toLowerCase().includes(cs)))).slice(0, 5);
      if (matchingJobs.length === 0) return;
      try {
        await axios.post('http://localhost:5000/api/send-job-alerts', { to: profile.email || currentUser.email, name: profile.name || currentUser.name, jobs: matchingJobs });
        console.log('Job alerts sent');
      } catch (error) { console.error('Failed to send alerts'); }
    };

    const lastEmailSent = localStorage.getItem('lastEmailSent');
    const twelveHours = 12 * 60 * 60 * 1000;
    if (!lastEmailSent || Date.now() - parseInt(lastEmailSent) > twelveHours) {
      sendJobAlerts();
      localStorage.setItem('lastEmailSent', Date.now().toString());
    }
    const interval = setInterval(() => {
      const lastEmail = localStorage.getItem('lastEmailSent');
      if (!lastEmail || Date.now() - parseInt(lastEmail) > twelveHours) {
        sendJobAlerts();
        localStorage.setItem('lastEmailSent', Date.now().toString());
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [jobs, profile]);

  // Interview reminders
  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      applications.forEach(app => {
        if (app.status === 'interview' && app.interviewDate && app.interviewTime) {
          const interviewDateTime = new Date(`${app.interviewDate}T${app.interviewTime}`);
          const timeDiff = interviewDateTime - now;
          if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000 && timeDiff > 30 * 60 * 1000) {
            if (!localStorage.getItem(`reminded_${app.id}`)) {
              alert(`⏰ Reminder: Your interview for "${app.jobTitle}" is in 1 hour!`);
              localStorage.setItem(`reminded_${app.id}`, 'true');
            }
          }
        }
      });
    }, 60 * 1000);
    return () => clearInterval(checkReminders);
  }, [applications]);

  const loadProfile = async () => {
    const result = await getCandidateProfile(currentUser.uid);
    if (result.success && result.data) setProfile(prev => ({ ...prev, ...result.data }));
  };

  const loadSavedJobs = async () => { const saved = await getSavedJobs(currentUser.uid); setSavedJobs(saved); };
  const loadApplications = async () => {
    const apps = await getApplicationsByCandidate(currentUser.uid);
    setApplications(apps);
    const interviewCount = apps.filter(a => a.status === 'interview').length;
    const avgMatch = apps.length > 0 ? Math.floor(apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / apps.length) : 0;
    setStats({ applied: apps.length, interviews: interviewCount, matchRate: avgMatch, profileStrength: calculateProfileStrength() });
  };

  const calculateProfileStrength = () => {
    let strength = 0;
    if (profile.name) strength += 10;
    if (profile.email) strength += 10;
    if (profile.age) strength += 10;
    if (profile.city) strength += 10;
    if (profile.phone) strength += 10;
    if (profile.education) strength += 10;
    if (profile.experience) strength += 15;
    if (profile.skills) strength += 25;
    return strength;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const result = await saveCandidateProfile(currentUser.uid, profile);
    setMessage(result.success ? '✅ Profile saved!' : '❌ Failed to save');
    if (result.success) setStats(prev => ({ ...prev, profileStrength: calculateProfileStrength() }));
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSaveJob = async (job) => {
    const result = await saveJobForLater(currentUser.uid, job.id, job);
    if (result.success) { setMessage(`✅ "${job.title}" saved!`); loadSavedJobs(); }
    else setMessage('❌ Failed to save');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveSavedJob = async (savedId, jobTitle) => {
    const result = await removeSavedJob(savedId);
    if (result.success) { setMessage(`✅ "${jobTitle}" removed`); loadSavedJobs(); }
    else setMessage('❌ Failed to remove');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleWithdraw = async (applicationId, jobTitle) => {
    if (window.confirm(`Withdraw application for "${jobTitle}"?`)) {
      const result = await withdrawApplication(applicationId);
      if (result.success) { setMessage(`✅ Application withdrawn`); loadApplications(); }
      else setMessage('❌ Failed to withdraw');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setMessage('❌ File too large! Max 1MB'); return; }
    setUploadedCV(file);
    setLoading(true);
    setMessage('📄 Analyzing CV with Gemini...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const cvText = event.target.result.substring(0, 5000);
      try {
        const response = await axios.post('http://localhost:5000/api/gemini/analyze-cv', { cvText, jobSkills: ['React', 'JavaScript', 'Python'], jobTitle: 'Software Developer' });
        setCvData(response.data);
        setProfile(prev => ({ ...prev, skills: response.data.extracted_skills?.join(', ') || '', experience: response.data.experience_years?.toString() || '' }));
        setMessage(`✅ Analysis complete! Match Score: ${response.data.match_score}%`);
        await saveCandidateProfile(currentUser.uid, { ...profile, skills: response.data.extracted_skills?.join(', ') || '', experience: response.data.experience_years?.toString() || '' });
      } catch (error) { setMessage('⚠️ Analysis failed'); }
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleApply = async (job) => {
    setLoading(true);
    const applicationData = {
      jobId: job.id, jobTitle: job.title, candidateId: currentUser.uid, candidateName: profile.name || currentUser?.name,
      candidateEmail: profile.email || currentUser?.email, age: profile.age, city: profile.city, experience: profile.experience,
      skills: profile.skills ? profile.skills.split(',').map(s => s.trim()) : [], coverLetter: coverLetter,
      matchScore: cvData?.match_score || Math.floor(Math.random() * 30) + 70, status: 'pending'
    };
    const result = await applyForJob(applicationData);
    if (result.success) { setMessage(`✅ Applied for "${job.title}"!`); setShowApplyModal(null); setCoverLetter(''); loadApplications(); }
    else setMessage('❌ Failed to apply');
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordMessage('❌ Passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { setPasswordMessage('❌ Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await changePassword(passwordData.oldPassword, passwordData.newPassword);
    setPasswordMessage(result.success ? '✅ Password changed!' : '❌ Failed: ' + result.error);
    if (result.success) setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setLoading(false);
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const getMatchScore = (jobSkills) => {
    if (!cvData?.extracted_skills) return 0;
    const matchCount = cvData.extracted_skills.filter(s => jobSkills?.some(js => js.toLowerCase().includes(s.toLowerCase()))).length;
    return Math.min(Math.floor((matchCount / Math.max(jobSkills?.length || 1, 1)) * 100), 100);
  };

  const getFilteredAndSortedJobs = () => {
    let filtered = jobs.filter(job => {
      const matchesSearch = searchTerm === '' || job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || job.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = !filters.location || job.location === filters.location;
      const matchesType = !filters.type || job.type === filters.type;
      return matchesSearch && matchesLocation && matchesType;
    });
    if (filters.sortBy === 'date') filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    else if (filters.sortBy === 'match') filtered.sort((a, b) => getMatchScore(b.skills) - getMatchScore(a.skills));
    else if (filters.sortBy === 'salary') filtered.sort((a, b) => (parseInt(b.salary) || 0) - (parseInt(a.salary) || 0));
    return filtered;
  };

  const isJobSaved = (jobId) => savedJobs.some(s => s.jobId === jobId);
  const filteredJobs = getFilteredAndSortedJobs();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎓 Candidate Dashboard</h1>
        <div className="header-info">
          <span>Welcome, {profile.name || currentUser?.name}</span>
          <button onClick={() => setShowSettings(true)} className="btn-settings" title="Settings">⚙️ Settings</button>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-value">{stats.applied}</div><div className="stat-label">Jobs Applied</div></div>
        <div className="stat-card"><div className="stat-icon">🎙️</div><div className="stat-value">{stats.interviews}</div><div className="stat-label">Interviews</div></div>
        <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-value">{stats.matchRate}%</div><div className="stat-label">Avg Match Rate</div></div>
        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{stats.profileStrength}%</div><div className="stat-label">Profile Strength</div></div>
      </div>

      <div className="dashboard-tabs">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
        <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>🔍 Browse Jobs ({filteredJobs.length})</button>
        <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>⭐ Saved Jobs ({savedJobs.length})</button>
        <button className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>📋 My Applications ({applications.length})</button>
      </div>

      {activeTab === 'profile' && (
        <div className="profile-section">
          <h2>👤 My Profile</h2>
          <div className="cv-upload-area"><h3>📄 Upload CV for AI Analysis</h3><input type="file" accept=".txt" onChange={handleCVUpload} disabled={loading} />
          {uploadedCV && !loading && <p className="cv-success">✅ {uploadedCV.name} uploaded</p>}{loading && <p>Analyzing...</p>}
          {cvData && (<div className="cv-result"><div className="match-score-large">⭐ Match Score: {cvData.match_score}%</div><div><strong>Skills:</strong> {cvData.extracted_skills?.join(', ')}</div><div><strong>Experience:</strong> {cvData.experience_years} years</div><div><strong>Recommendation:</strong> {cvData.recommendation}</div></div>)}</div>
          <div className="profile-form"><div className="form-row"><div className="form-group"><label>Full Name</label><input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} /></div><div className="form-group"><label>Email</label><input type="email" value={profile.email} disabled /></div></div>
          <div className="form-row"><div className="form-group"><label>Age</label><input type="number" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} /></div><div className="form-group"><label>City</label><input type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Phone</label><input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} /></div><div className="form-group"><label>Experience (years)</label><input type="text" value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} /></div></div>
          <div className="form-group"><label>Education</label><input type="text" placeholder="e.g., BS Computer Science" value={profile.education} onChange={(e) => setProfile({...profile, education: e.target.value})} /></div>
          <div className="form-group"><label>University</label><input type="text" value={profile.university} onChange={(e) => setProfile({...profile, university: e.target.value})} /></div>
          <div className="form-group"><label>Skills (comma separated)</label><input type="text" placeholder="React, JavaScript, Python" value={profile.skills} onChange={(e) => setProfile({...profile, skills: e.target.value})} /></div>
          <button onClick={handleSaveProfile} className="btn-primary" disabled={loading}>{loading ? 'Saving...' : '💾 Save Profile'}</button></div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="jobs-tab">
          <div className="search-filters"><input type="text" placeholder="🔍 Search by title or skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <div className="filter-row"><select value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} className="filter-select"><option value="">All Locations</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="filter-select"><option value="">All Types</option><option value="fulltime">Full Time</option><option value="parttime">Part Time</option></select>
          <select value={filters.sortBy} onChange={(e) => setFilters({...filters, sortBy: e.target.value})} className="filter-select"><option value="date">Sort: Latest</option><option value="match">Sort: Match Score</option><option value="salary">Sort: Highest Salary</option></select></div></div>
          <div className="jobs-list"><h2>📋 Available Jobs ({filteredJobs.length})</h2>
          {filteredJobs.length === 0 ? <div className="empty-state">No jobs found.</div> : filteredJobs.map(job => {
            const matchScore = getMatchScore(job.skills);
            const isSaved = isJobSaved(job.id);
            return <div key={job.id} className="job-card"><div className="job-header"><h3>{job.title}</h3><div className="job-match-badge" style={{background: matchScore > 70 ? '#22c55e' : matchScore > 40 ? '#f59e0b' : '#ef4444'}}>{matchScore}% Match</div></div>
            <p>{job.description?.substring(0, 150)}...</p><div className="job-skills">{job.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
            <div className="job-footer"><span>💰 {job.salary || 'Negotiable'}</span><span>📍 {job.location || 'Not specified'}</span>
            <div className="job-actions"><button onClick={() => setShowApplyModal(job)} className="btn-apply">Apply</button>
            <button onClick={() => isSaved ? handleRemoveSavedJob(savedJobs.find(s => s.jobId === job.id)?.id, job.title) : handleSaveJob(job)} className="btn-save">{isSaved ? '⭐ Saved' : '☆ Save'}</button></div></div></div>;
          })}</div>
        </div>
      )}

      {activeTab === 'saved' && (<div className="saved-tab"><h2>⭐ Saved Jobs</h2>{savedJobs.length === 0 ? <div className="empty-state">No saved jobs.</div> : savedJobs.map(saved => <div key={saved.id} className="job-card"><h3>{saved.jobData?.title}</h3><div className="job-skills">{saved.jobData?.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div><div className="job-footer"><button onClick={() => setShowApplyModal(saved.jobData)} className="btn-apply">Apply Now</button><button onClick={() => handleRemoveSavedJob(saved.id, saved.jobData?.title)} className="btn-delete">Remove</button></div></div>)}</div>)}

      {activeTab === 'applications' && (<div className="applications-tab"><h2>📋 My Applications</h2>{applications.length === 0 ? <div className="empty-state">No applications yet.</div> : applications.map(app => <div key={app.id} className="application-card"><div className="app-header"><h3>{app.jobTitle}</h3><span className={`app-status ${app.status}`}>{app.status}</span></div><div className="app-details"><div>📅 Applied: {new Date(app.appliedAt?.seconds * 1000).toLocaleDateString()}</div><div>⭐ Match: {app.matchScore}%</div></div>{app.status === 'pending' && <button onClick={() => handleWithdraw(app.id, app.jobTitle)} className="btn-withdraw">Withdraw</button>}{app.status === 'interview' && app.meetLink && <a href={app.meetLink} target="_blank" className="btn-meet">Join Interview</a>}</div>)}</div>)}

      {showApplyModal && (<div className="modal-overlay" onClick={() => setShowApplyModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><h3>📝 Apply for: {showApplyModal.title}</h3><div className="form-group"><label>Cover Letter</label><textarea rows="5" placeholder="Why are you a good fit?..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} /></div><div className="modal-actions"><button onClick={() => handleApply(showApplyModal)} className="btn-primary">{loading ? 'Submitting...' : 'Submit'}</button><button onClick={() => setShowApplyModal(null)} className="btn-secondary">Cancel</button></div></div></div>)}

      {showSettings && (<div className="modal-overlay" onClick={() => setShowSettings(false)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><h3>⚙️ Settings</h3><h4>Change Password</h4>
        <div className="form-group"><label>Current Password</label><input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} /></div>
        <div className="form-group"><label>New Password</label><input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} /></div>
        <div className="form-group"><label>Confirm Password</label><input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div>
        <button onClick={handleChangePassword} className="btn-primary">{loading ? 'Changing...' : 'Change Password'}</button>
        {passwordMessage && <div className="message">{passwordMessage}</div>}<button onClick={() => setShowSettings(false)} className="btn-secondary" style={{marginTop: '10px'}}>Close</button></div></div>)}

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;