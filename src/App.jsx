import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

const TEAM_ROSTER = [
  { id: '1', name: 'Mohamed Hafeel', jersey: 'R7', role: 'All-rounder', photo: '' },
  { id: '2', name: 'Hajar An Nourah', jersey: '30', role: 'Batsman', photo: '' },
  { id: '3', name: 'RIFNASANA', jersey: '98', role: 'Bowler', photo: '' },
  { id: '4', name: 'NALEEM NAFRY', jersey: '10', role: 'Batsman', photo: '' },
  { id: '5', name: 'Leenas Fernando', jersey: '07', role: 'Bowler', photo: '' },
  { id: '6', name: 'Irfan Ilham', jersey: '25', role: 'All-rounder', photo: '' },
  { id: '7', name: 'Najimudeen Ijaz', jersey: '96', role: 'Batsman', photo: '' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setShowLoginModal(false);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'matchEvents'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-amber-500/30 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-extrabold tracking-wide text-amber-400">GOLD STAR CC</h1>
          <p className="text-xs text-slate-400">Performance & Selection Tracker</p>
        </div>
        {user ? (
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
          >
            Logout Captain
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
          >
            Captain Login
          </button>
        )}
      </header>

      {showLoginModal && !user && (
        <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-amber-400">Captain Access</h2>
              <button type="button" onClick={() => setShowLoginModal(false)} className="text-slate-400 text-sm">
                Close
              </button>
            </div>
            <input
              type="email"
              required
              placeholder="Captain Email"
              className="w-full p-3 mb-3 rounded-xl bg-slate-800 border border-slate-700 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full p-3 mb-5 rounded-xl bg-slate-800 border border-slate-700 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-xl">
              Unlock Score Entry
            </button>
          </form>
        </div>
      )}

      <main className="p-4 max-w-lg mx-auto">
        {activeTab === 'dashboard' && <Dashboard events={events} />}
        {activeTab === 'batting' && user && <BattingTracker events={events} />}
        {activeTab === 'bowling' && user && <BowlingTracker events={events} />}
      </main>

      {user && (
        <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2.5 z-20">
          {['dashboard', 'batting', 'bowling'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                activeTab === tab ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function PlayerAvatar({ player }) {
  if (player.photo) {
    return <img src={player.photo} alt={player.name} className="w-11 h-11 rounded-full object-cover border border-amber-500" />;
  }
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

function BattingTracker({ events }) {
  const [selectedId, setSelectedId] = useState(TEAM_ROSTER[0].id);
  const [saving, setSaving] = useState(false);
  const player = TEAM_ROSTER.find((p) => p.id === selectedId);

  const logBall = async (runs, isOut = false) => {
    if (saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'matchEvents'), {
        type: 'batting',
        playerId: player.id,
        playerName: player.name,
        runs,
        balls: 1,
        isOut,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  const recentBatting = events.filter((e) => e.type === 'batting').slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold text-amber-400 uppercase mb-3">1. Select Batter</h2>
        <div className="grid grid-cols-2 gap-2">
          {TEAM_ROSTER.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`flex items-center gap-2.5 p-2 rounded-xl border text-left ${
                selectedId === p.id ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-800/60 border-slate-800'
              }`}
            >
              <PlayerAvatar player={p} />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-[11px] text-slate-400">#{p.jersey}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold text-amber-400 uppercase mb-1">2. Tap Ball Result ({player.name})</h2>
        <p className="text-xs text-slate-400 mb-4">Logs 1 legal ball faced + runs (extras ignored)</p>
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              disabled={saving}
              onClick={() => logBall(run, false)}
              className="py-4 rounded-xl bg-slate-800 active:bg-amber-500 active:text-slate-950 font-extrabold text-lg border border-slate-700"
            >
              {run}
            </button>
          ))}
          <button
            disabled={saving}
            onClick={() => logBall(0, true)}
            className="col-span-2 py-4 rounded-xl bg-red-600/90 active:bg-red-500 font-extrabold text-sm tracking-wide"
          >
            WICKET (OUT)
          </button>
        </div>
      </div>

      <RecentLog items={recentBatting} />
    </div>
  );
}

function BowlingTracker({ events }) {
  const [selectedId, setSelectedId] = useState(TEAM_ROSTER[2].id);
  const [runsOffBat, setRunsOffBat] = useState(0);
  const [extraRuns, setExtraRuns] = useState(0);
  const [isLegalBall, setIsLegalBall] = useState(true);
  const [isWicket, setIsWicket] = useState(false);
  const [saving, setSaving] = useState(false);

  const player = TEAM_ROSTER.find((p) => p.id === selectedId);

  const submitBall = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'matchEvents'), {
        type: 'bowling',
        playerId: player.id,
        playerName: player.name,
        runsGiven: Number(runsOffBat),
        extras: Number(extraRuns),
        legalBall: isLegalBall ? 1 : 0,
        isWicket,
        timestamp: new Date().toISOString(),
      });
      setRunsOffBat(0);
      setExtraRuns(0);
      setIsLegalBall(true);
      setIsWicket(false);
    } finally {
      setSaving(false);
    }
  };

  const recentBowling = events.filter((e) => e.type === 'bowling').slice(0, 5);

  return (
    <div className="space-y-4">
      <form onSubmit={submitBall} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label className="block text-xs font-bold text-amber-400 uppercase mb-2">1. Select Bowler</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold"
          >
            {TEAM_ROSTER.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (#{p.jersey})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">2. Runs Given (Off Bat)</label>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRunsOffBat(r)}
                className={`py-3 rounded-xl font-bold ${
                  runsOffBat === r ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">3. Extra Runs Given</label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 4, 5].map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => {
                  setExtraRuns(ex);
                  if (ex > 0) setIsLegalBall(false);
                }}
                className={`py-2.5 rounded-xl font-bold text-sm ${
                  extraRuns === ex ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                +{ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsLegalBall(!isLegalBall)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
              isLegalBall ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isLegalBall ? 'Legal Ball (Counts)' : 'Wide / No-Ball'}
          </button>
          <button
            type="button"
            onClick={() => setIsWicket(!isWicket)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
              isWicket ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isWicket ? 'Wicket Taken!' : 'No Wicket'}
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider"
        >
          Save Delivery
        </button>
      </form>

      <RecentLog items={recentBowling} />
    </div>
  );
}

function RecentLog({ items }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Entries (Tap Undo if mistake)</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-lg text-xs">
            <span>
              <strong className="text-amber-400">{item.playerName}:</strong>{' '}
              {item.type === 'batting'
                ? item.isOut
                  ? 'OUT (1 ball)'
                  : `${item.runs} run(s) off 1 ball`
                : `${item.runsGiven} runs + ${item.extras} extras ${item.isWicket ? '(W)' : ''}`}
            </span>
            <button
              onClick={() => deleteDoc(doc(db, 'matchEvents', item.id))}
              className="text-red-400 font-semibold ml-2"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ events }) {
  const stats = useMemo(() => {
    return TEAM_ROSTER.map((player) => {
      const bat = events.filter((e) => e.type === 'batting' && e.playerId === player.id);
      const bowl = events.filter((e) => e.type === 'bowling' && e.playerId === player.id);

      const runs = bat.reduce((s, e) => s + (e.runs || 0), 0);
      const ballsFaced = bat.reduce((s, e) => s + (e.balls || 0), 0);
      const outs = bat.filter((e) => e.isOut).length;
      const strikeRate = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';
      const batAvg = outs > 0 ? (runs / outs).toFixed(1) : runs.toFixed(1);

      const legalBalls = bowl.reduce((s, e) => s + (e.legalBall || 0), 0);
      const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      const runsConceded = bowl.reduce((s, e) => s + (e.runsGiven || 0) + (e.extras || 0), 0);
      const extras = bowl.reduce((s, e) => s + (e.extras || 0), 0);
      const wickets = bowl.filter((e) => e.isWicket).length;
      const economy = legalBalls > 0 ? (runsConceded / (legalBalls / 6)).toFixed(2) : '0.00';

      const impact = runs + wickets * 20 + (ballsFaced > 0 && Number(strikeRate) > 120 ? 10 : 0);
      const level = impact >= 80 ? 'ELITE' : impact >= 40 ? 'PRO' : impact > 0 ? 'ACTIVE' : 'READY';

      return { ...player, runs, ballsFaced, strikeRate, batAvg, overs, runsConceded, extras, wickets, economy, impact, level };
    }).sort((a, b) => b.impact - a.impact);
  }, [events]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Weekly Player Levels</h2>
        <span className="text-xs text-slate-400">{events.length} balls logged</span>
      </div>

      {stats.map((p, index) => (
        <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500">#{index + 1}</span>
              <PlayerAvatar player={p} />
              <div>
                <h3 className="font-bold text-sm text-white">{p.name}</h3>
                <p className="text-xs text-slate-400">
                  Jersey #{p.jersey} • {p.role}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {p.level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Batting</p>
              <p className="font-bold text-white">
                {p.runs} runs <span className="text-slate-400 font-normal">({p.ballsFaced}b)</span>
              </p>
              <p className="text-slate-300 mt-0.5">
                SR: <span className="text-amber-400 font-semibold">{p.strikeRate}</span> • Avg: {p.batAvg}
              </p>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Bowling</p>
              <p className="font-bold text-white">
                {p.wickets}W - {p.runsConceded}R <span className="text-slate-400 font-normal">({p.overs} ov)</span>
              </p>
              <p className="text-slate-300 mt-0.5">
                Econ: <span className="text-amber-400 font-semibold">{p.economy}</span> • Ext: {p.extras}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
