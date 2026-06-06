import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { generateQuestions } from '../utils/api';

const ACCEPTED = {'application/pdf':['.pdf'],'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'],'application/vnd.openxmlformats-officedocument.presentationml.presentation':['.pptx'],'text/plain':['.txt']};
const BLOOM_COLORS = {Remember:'#3b82f6',Understand:'#8b5cf6',Apply:'#10b981',Analyze:'#f59e0b',Evaluate:'#ef4444',Create:'#ec4899'};
const FILE_ICONS = {'.pdf':'📄','.docx':'📝','.pptx':'📊','.txt':'📃'};

export default function HomePage() {
  const navigate = useNavigate();
  const { setResults, setSessionId, setIsProcessing, apiKey, saveApiKey } = useApp();
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [subject, setSubject] = useState('');
  const [questionTypes, setQuestionTypes] = useState(['mcq', 'short']);
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) { setFile(accepted[0]); toast.success(`✓ ${accepted[0].name} ready`); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, maxSize: 25*1024*1024,
    onDropRejected: (files) => { const err = files[0]?.errors[0]; toast.error(err?.code === 'file-too-large' ? 'File must be under 25MB' : 'Only PDF, DOCX, PPTX, TXT accepted'); }
  });

  const toggleType = (type) => setQuestionTypes(prev => prev.includes(type) ? (prev.length > 1 ? prev.filter(t => t !== type) : prev) : [...prev, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please upload a study material file'); return; }
    if (localApiKey && localApiKey !== apiKey) saveApiKey(localApiKey);
    setLoading(true); setIsProcessing(true); setProgress(0);
    const stages = ['Extracting text...','Preprocessing content...','Analyzing topics...','Generating questions...','Classifying by Bloom\'s Taxonomy...'];
    let stageIdx = 0;
    const stageInterval = setInterval(() => { if (stageIdx < stages.length) { setStage(stages[stageIdx++]); setProgress(Math.min(90, stageIdx*18)); } }, 1200);
    try {
      const form = new FormData();
      form.append('file', file); form.append('num_questions', numQuestions);
      form.append('difficulty', difficulty); form.append('question_types', questionTypes.join(','));
      form.append('subject', subject);
      if (localApiKey) form.append('api_key', localApiKey);
      const { data } = await generateQuestions(form);
      clearInterval(stageInterval); setProgress(100); setStage('Complete!');
      setResults(data); setSessionId(data.session_id);
      toast.success(`Generated ${data.questions.length} questions!`);
      setTimeout(() => navigate('/results'), 500);
    } catch (err) {
      clearInterval(stageInterval);
      toast.error(err.response?.data?.detail || 'Generation failed. Check the backend is running.');
      setStage(''); setProgress(0);
    } finally { setLoading(false); setIsProcessing(false); }
  };

  const fileExt = file ? '.'+file.name.split('.').pop().toLowerCase() : null;

  return (
    <div className="container" style={{padding:'3rem 1.5rem'}}>
      <div style={{textAlign:'center',marginBottom:'3.5rem',animation:'fadeUp 0.6s ease'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 1rem',background:'var(--accent-dim)',border:'1px solid var(--border-light)',borderRadius:999,fontSize:'0.8rem',color:'var(--accent-light)',marginBottom:'1.5rem',fontFamily:'var(--font-mono)'}}>✦ Powered by Claude AI + Bloom's Taxonomy</div>
        <h1 style={{marginBottom:'1rem',background:'linear-gradient(135deg,var(--text-primary) 40%,var(--accent-light))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Generate Question Papers<br/>from Any Study Material</h1>
        <p style={{color:'var(--text-secondary)',fontSize:'1.1rem',maxWidth:'560px',margin:'0 auto 2rem'}}>Upload PDF, DOCX, PPTX or TXT files. Our AI generates structured, Bloom's Taxonomy-classified question papers instantly.</p>
        <div className="tag-list" style={{justifyContent:'center'}}>
          {['PDF & DOCX','PPTX & TXT','MCQ + Short + Long',"Bloom's Taxonomy",'PDF Export','Analytics'].map(f=><span key={f} className="chip">{f}</span>)}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:'2rem',alignItems:'start'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div {...getRootProps()} style={{background:isDragActive?'rgba(124,110,247,0.08)':'var(--bg-card)',border:`2px dashed ${isDragActive?'var(--accent)':file?'var(--success)':'var(--border)'}`,borderRadius:'var(--radius-lg)',padding:'3rem 2rem',textAlign:'center',cursor:'pointer',transition:'all 0.2s'}}>
              <input {...getInputProps()} />
              {file ? (
                <div style={{animation:'fadeIn 0.3s ease'}}>
                  <div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>{FILE_ICONS[fileExt]||'📄'}</div>
                  <div style={{fontWeight:600,fontSize:'1rem',marginBottom:'0.4rem'}}>{file.name}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{(file.size/1024/1024).toFixed(2)} MB · {fileExt?.toUpperCase()?.slice(1)}</div>
                  <button type="button" onClick={(e)=>{e.stopPropagation();setFile(null);}} style={{marginTop:'1rem',background:'none',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'0.35rem 0.8rem',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.8rem'}}>Remove</button>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:'3rem',marginBottom:'1rem',opacity:0.5}}>⬆</div>
                  <div style={{fontWeight:600,fontSize:'1rem',marginBottom:'0.5rem',color:isDragActive?'var(--accent-light)':'var(--text-primary)'}}>{isDragActive?'Drop your file here':'Drag & drop your study material'}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.85rem',marginBottom:'1rem'}}>or click to browse files</div>
                  <div className="tag-list" style={{justifyContent:'center'}}>
                    {['PDF','DOCX','PPTX','TXT'].map(t=><span key={t} className="badge" style={{background:'var(--bg-elevated)',color:'var(--text-secondary)',border:'1px solid var(--border)'}}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <label>Subject / Course Name <span style={{color:'var(--text-muted)'}}>(optional)</span></label>
              <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Computer Science, Biology, History..." />
            </div>

            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                <label style={{margin:0}}>Anthropic API Key</label>
                <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Optional — uses rule-based fallback if omitted</span>
              </div>
              <div style={{position:'relative'}}>
                <input type={showApiKey?'text':'password'} value={localApiKey} onChange={e=>setLocalApiKey(e.target.value)} placeholder="sk-ant-..." style={{paddingRight:'3rem'}} />
                <button type="button" onClick={()=>setShowApiKey(v=>!v)} style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'1rem'}}>{showApiKey?'🙈':'👁'}</button>
              </div>
              <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>Key is stored locally in your browser.</p>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem',position:'sticky',top:'80px'}}>
            <div className="card">
              <label>Number of Questions</label>
              <div style={{display:'flex',alignItems:'center',gap:'1rem',marginTop:'0.5rem'}}>
                <input type="range" min={3} max={50} value={numQuestions} onChange={e=>setNumQuestions(Number(e.target.value))} style={{padding:0,border:'none',background:'none',flex:1}} />
                <span style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',fontWeight:700,color:'var(--accent-light)',minWidth:'2.5rem',textAlign:'center'}}>{numQuestions}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'var(--text-muted)'}}><span>3 min</span><span>50 max</span></div>
            </div>

            <div className="card">
              <label>Difficulty Level</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginTop:'0.5rem'}}>
                {['easy','medium','hard'].map(d=>(
                  <button key={d} type="button" onClick={()=>setDifficulty(d)} style={{padding:'0.6rem',borderRadius:'var(--radius-sm)',border:`2px solid ${difficulty===d?(d==='easy'?'var(--success)':d==='medium'?'var(--warning)':'var(--error)'):'var(--border)'}`,background:difficulty===d?(d==='easy'?'rgba(34,197,94,0.1)':d==='medium'?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)'):'var(--bg-secondary)',color:difficulty===d?'var(--text-primary)':'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,textTransform:'capitalize',transition:'all 0.15s'}}>
                    {d==='easy'?'🟢':d==='medium'?'🟡':'🔴'} {d}
                  </button>
                ))}
              </div>
              <div style={{marginTop:'1rem'}}>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'0.5rem'}}>Bloom's Taxonomy Focus:</div>
                <div className="tag-list">
                  {(difficulty==='easy'?['Remember','Understand']:difficulty==='medium'?['Understand','Apply','Analyze']:['Analyze','Evaluate','Create']).map(b=>(
                    <span key={b} className={`badge badge-bloom-${b}`}>{b}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <label>Question Types</label>
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.5rem'}}>
                {[{id:'mcq',label:'Multiple Choice (MCQ)',icon:'◉'},{id:'short',label:'Short Answer',icon:'✏'},{id:'long',label:'Long Answer / Essay',icon:'📜'},{id:'true_false',label:'True / False',icon:'⊙'},{id:'fill_blank',label:'Fill in the Blank',icon:'___'}].map(t=>(
                  <button key={t.id} type="button" onClick={()=>toggleType(t.id)} style={{display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.55rem 0.75rem',borderRadius:'var(--radius-sm)',border:`1px solid ${questionTypes.includes(t.id)?'var(--accent)':'var(--border)'}`,background:questionTypes.includes(t.id)?'var(--accent-dim)':'var(--bg-secondary)',color:questionTypes.includes(t.id)?'var(--accent-light)':'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:500,textAlign:'left',transition:'all 0.15s'}}>
                    <span style={{opacity:0.7,fontSize:'0.8rem'}}>{t.icon}</span>{t.label}
                    {questionTypes.includes(t.id)&&<span style={{marginLeft:'auto',fontSize:'0.7rem'}}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading||!file} className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center'}}>
              {loading?(<>
                <span style={{display:'inline-block',width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite'}} />Processing...
              </>):'✦ Generate Question Paper'}
            </button>

            {loading&&(
              <div className="card" style={{animation:'fadeIn 0.3s ease'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:'0.6rem'}}>
                  <span style={{color:'var(--accent-light)',fontFamily:'var(--font-mono)'}}>{stage}</span>
                  <span style={{color:'var(--text-muted)'}}>{progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}} /></div>
              </div>
            )}
          </div>
        </div>
      </form>

      <div style={{marginTop:'4rem'}}>
        <div className="ornament"><span className="ornament-icon">◈</span></div>
        <h2 style={{textAlign:'center',marginBottom:'0.5rem',fontSize:'1.5rem'}}>Bloom's Taxonomy Classification</h2>
        <p style={{textAlign:'center',color:'var(--text-secondary)',marginBottom:'2rem',fontSize:'0.9rem'}}>Every question is automatically classified by cognitive level</p>
        <div className="grid-3" style={{gap:'1rem'}}>
          {[{level:'Remember',icon:'🔵',desc:'Recall facts, basic concepts, and information',verbs:'Define, List, Recall, Name'},{level:'Understand',icon:'🟣',desc:'Explain ideas and interpret meaning',verbs:'Explain, Summarize, Classify'},{level:'Apply',icon:'🟢',desc:'Use knowledge in new situations',verbs:'Solve, Demonstrate, Use'},{level:'Analyze',icon:'🟡',desc:'Draw connections and break down info',verbs:'Compare, Differentiate, Examine'},{level:'Evaluate',icon:'🔴',desc:'Justify decisions and critique',verbs:'Judge, Defend, Assess'},{level:'Create',icon:'🩷',desc:'Produce original work and design solutions',verbs:'Design, Construct, Develop'}].map(b=>(
            <div key={b.level} className="card" style={{borderLeft:`3px solid ${BLOOM_COLORS[b.level]}`}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'1.1rem'}}>{b.icon}</span>
                <span style={{fontWeight:700,color:BLOOM_COLORS[b.level]}}>{b.level}</span>
              </div>
              <p style={{color:'var(--text-secondary)',fontSize:'0.83rem',lineHeight:1.5,marginBottom:'0.5rem'}}>{b.desc}</p>
              <span style={{fontFamily:'var(--font-mono)',fontSize:'0.72rem',color:'var(--text-muted)'}}>{b.verbs}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
