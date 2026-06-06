import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getDownloadUrl, submitFeedback } from '../utils/api';
import toast from 'react-hot-toast';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TYPE_LABELS = {mcq:'MCQ',short:'Short',long:'Long',true_false:'T/F',fill_blank:'Fill'};

function QuestionCard({ question: q, index, expanded, onToggle }) {
  return (
    <div className="card" style={{marginBottom:'1rem',borderLeft:'3px solid var(--accent)',cursor:'pointer',animation:`fadeUp 0.4s ease ${index*0.04}s both`}} onClick={onToggle}>
      <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
        <div style={{minWidth:32,height:32,background:'var(--accent-dim)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:'var(--accent-light)',fontWeight:700}}>{index+1}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem',marginBottom:'0.6rem'}}>
            <span className={`badge badge-${q.type}`}>{TYPE_LABELS[q.type]||q.type}</span>
            <span className={`badge badge-bloom-${q.bloom_level}`}>{q.bloom_level}</span>
            <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
            {q.marks&&<span className="badge" style={{background:'var(--bg-elevated)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>{q.marks} mark{q.marks>1?'s':''}</span>}
          </div>
          <p style={{fontWeight:500,lineHeight:1.6,marginBottom:expanded?'1rem':0}}>{q.question}</p>
          {expanded&&(
            <div style={{animation:'fadeIn 0.2s ease'}}>
              {q.options&&q.options.length>0&&(
                <div style={{marginTop:'0.75rem',display:'flex',flexDirection:'column',gap:'0.35rem'}}>
                  {q.options.map((opt,oi)=>{
                    const isAnswer = q.answer&&q.answer.startsWith(opt.slice(0,2));
                    return <div key={oi} style={{padding:'0.5rem 0.85rem',background:isAnswer?'rgba(34,197,94,0.1)':'var(--bg-secondary)',border:`1px solid ${isAnswer?'rgba(34,197,94,0.4)':'var(--border)'}`,borderRadius:'var(--radius-sm)',fontSize:'0.88rem',color:isAnswer?'#4ade80':'var(--text-secondary)',fontWeight:isAnswer?600:400}}>{isAnswer&&'✓ '}{opt}</div>;
                  })}
                </div>
              )}
              <div style={{marginTop:'1rem',padding:'0.85rem',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'var(--radius-sm)'}}>
                <div style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'#4ade80',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Answer</div>
                <p style={{fontSize:'0.9rem',color:'var(--text-primary)',lineHeight:1.6}}>{q.answer}</p>
              </div>
              {q.explanation&&<div style={{marginTop:'0.75rem',padding:'0.75rem',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
                <div style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',marginBottom:'0.35rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Explanation</div>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',lineHeight:1.6}}>{q.explanation}</p>
              </div>}
            </div>
          )}
        </div>
        <span style={{color:'var(--text-muted)',fontSize:'0.8rem',marginLeft:'auto',flexShrink:0}}>{expanded?'▲':'▼'}</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { results, sessionId } = useApp();
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [filter, setFilter] = useState('all');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!results) return (
    <div className="container" style={{padding:'4rem 1.5rem',textAlign:'center'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>◈</div>
      <h2 style={{marginBottom:'0.75rem'}}>No results yet</h2>
      <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Generate a question paper first.</p>
      <button className="btn btn-primary" onClick={()=>navigate('/')}>← Back to Generator</button>
    </div>
  );

  const { questions=[], bloom_distribution={}, topics=[], keywords=[], processing_time, word_count, summary, filename } = results;
  const filtered = filter==='all'?questions:questions.filter(q=>q.type===filter||q.bloom_level===filter);
  const displayed = showAll?filtered:filtered.slice(0,10);
  const bloomData = Object.entries(bloom_distribution).map(([name,value])=>({name,value}));

  const handleDownload = (format) => {
    if (!sessionId) { toast.error('Session ID missing'); return; }
    window.open(getDownloadUrl(sessionId,format),'_blank');
    toast.success(`Downloading ${format.toUpperCase()}...`);
  };

  const handleFeedback = async () => {
    if (!feedbackRating) { toast.error('Please select a star rating'); return; }
    try { await submitFeedback({session_id:sessionId,rating:feedbackRating,note:feedbackNote,filename}); setFeedbackSent(true); toast.success('Thank you for your feedback!'); }
    catch { toast.error('Could not submit feedback'); }
  };

  const types = ['all',...new Set(questions.map(q=>q.type))];
  const totalMarks = questions.reduce((s,q)=>s+(q.marks||1),0);

  return (
    <div className="container" style={{padding:'2rem 1.5rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
        <div>
          <button className="btn btn-ghost" style={{marginBottom:'0.75rem',fontSize:'0.82rem'}} onClick={()=>navigate('/')}>← Generate New</button>
          <h1 style={{fontSize:'2rem',marginBottom:'0.35rem'}}>Question Paper</h1>
          <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>{filename&&<><span style={{fontFamily:'var(--font-mono)'}}>{filename}</span> · </>}{questions.length} questions · {totalMarks} total marks{processing_time&&<> · {processing_time}s</>}</p>
        </div>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
          <button className="btn btn-secondary" onClick={()=>handleDownload('txt')}>⬇ TXT</button>
          <button className="btn btn-gold" onClick={()=>handleDownload('pdf')}>⬇ Download PDF</button>
        </div>
      </div>

      <div className="grid-4" style={{marginBottom:'1.5rem'}}>
        {[{label:'Questions',value:questions.length},{label:'Total Marks',value:totalMarks},{label:'Word Count',value:word_count?.toLocaleString()||'—'},{label:'Topics',value:topics.length||'—'}].map(s=>(
          <div key={s.label} className="stat-card"><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1.5rem',alignItems:'start'}}>
        <div>
          {summary&&<div className="card" style={{marginBottom:'1.5rem',borderLeft:'3px solid var(--gold)'}}><div style={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',color:'var(--gold)',marginBottom:'0.4rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>Material Summary</div><p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.7}}>{summary}</p></div>}

          <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
            {types.map(t=>(
              <button key={t} type="button" onClick={()=>{setFilter(t);setExpandedIdx(null);setShowAll(false);}} style={{padding:'0.35rem 0.85rem',borderRadius:999,border:`1px solid ${filter===t?'var(--accent)':'var(--border)'}`,background:filter===t?'var(--accent-dim)':'transparent',color:filter===t?'var(--accent-light)':'var(--text-secondary)',cursor:'pointer',fontSize:'0.82rem',fontWeight:500,textTransform:'capitalize'}}>
                {t==='all'?`All (${questions.length})`:`${TYPE_LABELS[t]||t} (${questions.filter(q=>q.type===t).length})`}
              </button>
            ))}
          </div>

          {displayed.map((q,i)=>(
            <QuestionCard key={q.id||i} question={q} index={i} expanded={expandedIdx===i} onToggle={()=>setExpandedIdx(expandedIdx===i?null:i)} />
          ))}

          {filtered.length>10&&!showAll&&(
            <div style={{textAlign:'center',marginTop:'1rem'}}>
              <button className="btn btn-secondary" onClick={()=>setShowAll(true)}>Show all {filtered.length} questions</button>
            </div>
          )}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem',position:'sticky',top:'80px'}}>
          {bloomData.some(d=>d.value>0)&&(
            <div className="card">
              <h3 style={{fontSize:'1rem',marginBottom:'0.25rem'}}>Bloom's Distribution</h3>
              <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:'1rem'}}>Cognitive level coverage</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={bloomData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}} />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
                  <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:'0.35rem',marginTop:'0.5rem'}}>
                {bloomData.filter(d=>d.value>0).map(d=>(
                  <div key={d.name} style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.8rem'}}>
                    <span className={`badge badge-bloom-${d.name}`} style={{minWidth:70}}>{d.name}</span>
                    <div className="progress-bar" style={{flex:1}}><div className="progress-fill" style={{width:`${(d.value/questions.length)*100}%`}} /></div>
                    <span style={{color:'var(--text-muted)',minWidth:20,textAlign:'right'}}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topics.length>0&&<div className="card"><h3 style={{fontSize:'1rem',marginBottom:'0.75rem'}}>Topics</h3><div className="tag-list">{topics.map(t=><span key={t} className="chip">{t}</span>)}</div></div>}

          {keywords.length>0&&<div className="card"><h3 style={{fontSize:'1rem',marginBottom:'0.75rem'}}>Key Terms</h3><div className="tag-list">{keywords.map(k=><span key={k} style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem',padding:'0.2rem 0.6rem',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-secondary)'}}>{k}</span>)}</div></div>}

          <div className="card" style={{borderColor:'var(--gold)'}}>
            <h3 style={{fontSize:'1rem',marginBottom:'0.75rem',color:'var(--gold)'}}>Rate Results</h3>
            {feedbackSent?<p style={{color:'var(--success)',fontSize:'0.9rem'}}>✓ Thank you!</p>:(
              <>
                <div style={{display:'flex',gap:'0.35rem',marginBottom:'0.75rem'}}>
                  {[1,2,3,4,5].map(star=><button key={star} type="button" onClick={()=>setFeedbackRating(star)} style={{background:'none',border:'none',fontSize:'1.5rem',cursor:'pointer',opacity:star<=feedbackRating?1:0.3,transition:'opacity 0.15s'}}>★</button>)}
                </div>
                <textarea value={feedbackNote} onChange={e=>setFeedbackNote(e.target.value)} placeholder="Any feedback? (optional)" style={{height:'4rem',resize:'none',fontSize:'0.85rem',marginBottom:'0.75rem'}} />
                <button className="btn btn-gold" style={{width:'100%',justifyContent:'center'}} onClick={handleFeedback}>Submit Feedback</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
