import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAnalytics } from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#7c6ef7','#d4af37','#22c55e','#ef4444','#ec4899','#f59e0b','#3b82f6','#10b981'];
const CT = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'0.6rem 0.9rem',fontSize:12}}><p style={{color:'var(--text-secondary)',marginBottom:'0.25rem'}}>{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color||'var(--accent-light)',fontWeight:600}}>{p.name}: {p.value}</p>)}</div>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(r=>setStats(r.data)).catch(()=>toast.error('Could not load analytics — is the backend running?')).finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <div className="container" style={{padding:'4rem 1.5rem'}}>
      <div className="grid-4" style={{marginBottom:'1.5rem'}}>{[1,2,3,4].map(i=><div key={i} className="skeleton stat-card" style={{height:90}} />)}</div>
      <div className="grid-2">{[1,2].map(i=><div key={i} className="skeleton card" style={{height:240}} />)}</div>
    </div>
  );

  if (!stats) return (
    <div className="container" style={{padding:'4rem 1.5rem',textAlign:'center'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>◉</div>
      <h2>Dashboard unavailable</h2>
      <p style={{color:'var(--text-secondary)',marginTop:'0.5rem'}}>Could not connect to backend. Ensure the server is running on port 8000.</p>
    </div>
  );

  const diffData = Object.entries(stats.difficulty_distribution||{}).map(([name,value])=>({name:name.charAt(0).toUpperCase()+name.slice(1),value}));
  const topTopics = (stats.top_topics||[]).slice(0,6);

  return (
    <div className="container" style={{padding:'2rem 1.5rem',animation:'fadeUp 0.5s ease'}}>
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{fontSize:'2rem',marginBottom:'0.35rem'}}>Analytics Dashboard</h1>
        <p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>Usage statistics and performance insights</p>
      </div>

      <div className="grid-4" style={{marginBottom:'1.5rem'}}>
        {[{label:'Files Processed',value:stats.total_files??0,color:'var(--accent)'},{label:'Questions Generated',value:(stats.total_questions??0).toLocaleString(),color:'var(--gold)'},{label:'Avg Processing Time',value:`${stats.avg_processing_time??0}s`,color:'var(--success)'},{label:'Avg Rating',value:stats.avg_rating?`${stats.avg_rating}/5`:'—',color:'var(--warning)'}].map(s=>(
          <div key={s.label} className="stat-card"><div className="stat-value" style={{color:s.color}}>{s.value}</div><div className="stat-label">{s.label}</div></div>
        ))}
      </div>

      <div className="grid-2" style={{marginBottom:'1.5rem'}}>
        <div className="card">
          <h3 style={{fontSize:'1rem',marginBottom:'0.25rem'}}>Daily Usage</h3>
          <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:'1rem'}}>Sessions per day (last 7 days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.daily_usage||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickFormatter={d=>d.slice(5)} />
              <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} />
              <Tooltip content={<CT />} />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{fill:'var(--accent)',r:4}} name="Sessions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{fontSize:'1rem',marginBottom:'0.25rem'}}>Difficulty Distribution</h3>
          <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:'1rem'}}>Breakdown of difficulty levels</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={diffData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {diffData.map((_,i)=><Cell key={i} fill={['#22c55e','#f59e0b','#ef4444'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} />
              <Legend formatter={v=><span style={{color:'var(--text-secondary)',fontSize:12}}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:'1.5rem'}}>
        <div className="card">
          <h3 style={{fontSize:'1rem',marginBottom:'0.25rem'}}>Top Topics</h3>
          <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:'1rem'}}>Most frequent topics processed</p>
          {topTopics.length>0?(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topTopics} layout="vertical">
                <XAxis type="number" tick={{fill:'var(--text-muted)',fontSize:11}} />
                <YAxis type="category" dataKey="topic" width={120} tick={{fill:'var(--text-muted)',fontSize:11}} />
                <Tooltip content={<CT />} />
                <Bar dataKey="count" name="Frequency" radius={[0,4,4,0]}>{topTopics.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:'0.9rem'}}>No topic data yet.</div>}
        </div>
        <div className="card">
          <h3 style={{fontSize:'1rem',marginBottom:'0.25rem'}}>Recent Sessions</h3>
          <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:'1rem'}}>Latest processed files</p>
          {(stats.recent_sessions||[]).length>0?(
            <div style={{display:'flex',flexDirection:'column',gap:'0.65rem'}}>
              {(stats.recent_sessions||[]).map((s,i)=>(
                <div key={s.session_id||i} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem',background:'var(--bg-secondary)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
                  <div style={{width:36,height:36,background:`${COLORS[i%COLORS.length]}22`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>📄</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.filename||'Unknown file'}</div>
                    <div style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>{s.num_questions} questions · {s.difficulty} · {s.date}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.25rem'}}>
                    <span className={`badge badge-${s.difficulty}`}>{s.difficulty}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'0.7rem',color:'var(--text-muted)'}}>{s.processing_time}s</span>
                  </div>
                </div>
              ))}
            </div>
          ):<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'var(--text-muted)',fontSize:'0.9rem'}}>No sessions yet.</div>}
        </div>
      </div>
    </div>
  );
}
