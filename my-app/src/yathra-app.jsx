import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen, Sparkles, Wallet, ShieldCheck, Bell, Award,
  Bus, TrainFront, Car, Footprints, Ship, MapPin, TrendingUp,
  TrendingDown, Share2, Clock, Leaf, ChevronRight, Info,
  AlertTriangle, Repeat, Gift, ArrowUpRight, CheckCircle2, X,
  Plus, Banknote
} from "lucide-react";

/* ============================================================
   TOKENS — single cohesive palette, no blue/neon.
   Inspired by Kerala backwaters at dusk + temple-mural warmth.
   ============================================================ */
const C = {
  teal900: "#092523",
  teal800: "#0E3B36",
  teal700: "#134A43",
  teal600: "#1B5245",
  teal500: "#296B5C",
  gold: "#E7A537",
  goldSoft: "#F0C878",
  terracotta: "#C1502E",
  terracottaSoft: "#E08A63",
  cream: "#F7EFDD",
  creamDim: "#E7DCC3",
  ink: "#17231F",
};

const MODES = {
  Metro: { icon: TrainFront, color: C.gold },
  Bus: { icon: Bus, color: C.terracottaSoft },
  Auto: { icon: Car, color: C.goldSoft },
  Car: { icon: Car, color: C.terracotta },
  Ferry: { icon: Ship, color: C.teal500 },
  Walk: { icon: Footprints, color: C.creamDim },
};

/* ============================================================
   MOCK DATA
   ============================================================ */
const INITIAL_TRIPS = [
  { id: 1, mode: "Metro", route: ["Aluva", "MG Road"], date: "Jul 28", day: "Mon", distance: 14.2, time: "26 min", fare: 40 },
  { id: 2, mode: "Bus", route: ["Ernakulam", "Fort Kochi"], date: "Jul 27", day: "Sun", distance: 9.8, time: "34 min", fare: 22 },
  { id: 3, mode: "Auto", route: ["Home", "Lulu Mall"], date: "Jul 26", day: "Sat", distance: 4.1, time: "15 min", fare: 65 },
  { id: 4, mode: "Car", route: ["Kochi", "Munnar"], date: "Jul 24", day: "Thu", distance: 130, time: "3h 40m", fare: 780 },
  { id: 5, mode: "Ferry", route: ["Vypin", "Fort Kochi"], date: "Jul 22", day: "Tue", distance: 2.3, time: "12 min", fare: 5 },
  { id: 6, mode: "Walk", route: ["Home", "Marine Drive"], date: "Jul 21", day: "Mon", distance: 3.4, time: "42 min", fare: 0 },
];

/* Maps a trip mode to its cost-breakdown bucket label */
const MODE_TO_COST_LABEL = {
  Car: "Fuel (car)",
  Bus: "Bus",
  Metro: "Metro",
  Auto: "Auto",
  Ferry: "Ferry",
  Walk: null, // free, not tracked in spend
};

const MILESTONES = {
  trip: {
    label: "Per-trip", ref: "Metro · Aluva → MG Road",
    stats: [
      { label: "Distance", value: "14.2 km" },
      { label: "Mode", value: "Metro" },
      { label: "Time", value: "26 min" },
      { label: "Saved vs auto", value: "₹135" },
    ],
    ecoPoints: 18,
    headline: "Nice one — that's a cleaner commute.",
  },
  weekly: {
    label: "Weekly", ref: "Jul 21 – Jul 27",
    stats: [
      { label: "Total distance", value: "187.4 km" },
      { label: "Active days", value: "6 / 7" },
      { label: "Spent", value: "₹640" },
      { label: "Saved", value: "₹410" },
    ],
    ecoPoints: 96,
    headline: "Your greenest week yet — 68% of trips by public transit.",
  },
  monthly: {
    label: "Monthly", ref: "July 2026",
    stats: [
      { label: "Total distance", value: "812 km" },
      { label: "Total spent", value: "₹3,240" },
      { label: "Tier unlocked", value: "Spice Route" },
      { label: "Vs June", value: "+22% transit" },
    ],
    ecoPoints: 410,
    headline: "22% more public-transit trips than June. Onward.",
  },
};

const INITIAL_COST_BREAKDOWN = [
  { mode: "Fuel (car)", amount: 1830, cashAmount: 0 },
  { mode: "Bus", amount: 950, cashAmount: 0 },
  { mode: "Metro", amount: 720, cashAmount: 0 },
  { mode: "Auto", amount: 640, cashAmount: 0 },
];

const SUGGESTION = {
  route: "Kakkanad ↔ Infopark",
  detail: "You've taken Auto on this stretch 14 times this month.",
  action: "Switch to Metro + feeder bus",
  save: "₹450/month",
  cost: "+12 min avg travel time",
};

const TRUST_LOG = [
  { date: "Jul 28, 9:02 AM", summary: "Mode: Metro · Distance band: 10–15 km · Time-of-day: morning peak" },
  { date: "Jul 27, 6:40 PM", summary: "Mode: Bus · Distance band: 5–10 km · Time-of-day: evening" },
  { date: "Jul 24, 7:15 AM", summary: "Mode: Car · Distance band: 100+ km · Time-of-day: early morning" },
  { date: "Jul 22, 4:20 PM", summary: "Mode: Ferry · Distance band: 0–5 km · Time-of-day: afternoon" },
];

const REMINDERS = {
  pattern: {
    title: "Recurring pattern detected",
    body: "Weekday mornings, 8:05–8:15 AM, you usually take Bus 42 from Kaloor to Infopark.",
    cta: "Nudge me 10 min before",
  },
  anomaly: {
    title: "Unusual delay today",
    body: "Today's commute took 37 min longer than your usual — heavy traffic reported near Vytila Hub, NH66.",
    cta: "See alternate routes",
  },
};

const TIERS = ["Coconut Bronze", "Backwater Silver", "Spice Route Gold", "Monsoon Platinum"];
const REWARDS = {
  points: 2480,
  tierIndex: 1,
  nextAt: 3000,
  perks: [
    { name: "Alleppey Houseboat Co.", offer: "15% off an overnight stay", tag: "Backwaters" },
    { name: "Wayanad Homestay Collective", offer: "₹500 off any 2-night stay", tag: "Hills" },
    { name: "Munnar Tea Trails", offer: "Free tasting tour with trek booking", tag: "Plantations" },
  ],
};

/* ============================================================
   SMALL UTILITIES
   ============================================================ */
function useCountUp(target, duration = 900, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <div
      className={`yr-reveal ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   SCREEN: TRIP DIARY
   ============================================================ */
function TicketStub({ trip, delay }) {
  const M = MODES[trip.mode];
  const Icon = M.icon;
  return (
    <Reveal delay={delay}>
      <div className="yr-ticket">
        <div className="yr-ticket-stub" style={{ background: M.color }}>
          <Icon size={20} color={C.ink} strokeWidth={2.2} />
          <span className="yr-ticket-date">{trip.date}</span>
          <span className="yr-ticket-day">{trip.day}</span>
        </div>
        <div className="yr-ticket-perf" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="yr-ticket-body">
          <div className="yr-ticket-route">
            <span>{trip.route[0]}</span>
            <span className="yr-route-line">
              <MapPin size={11} />
            </span>
            <span>{trip.route[1]}</span>
            {trip.cash && (
              <span className="yr-cash-badge">
                <Banknote size={10} /> Cash
              </span>
            )}
          </div>
          <div className="yr-ticket-meta">
            <div><span className="yr-mono">{trip.distance} km</span><em>distance</em></div>
            <div><span className="yr-mono">{trip.time}</span><em>time</em></div>
            <div><span className="yr-mono">{trip.mode}</span><em>mode</em></div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function DiaryScreen({ trips, onAddExpense }) {
  return (
    <div className="yr-screen">
      <ScreenHeader eyebrow="Auto-captured, on-device" title="Trip Diary" />
      <p className="yr-lede">Every journey logged quietly in the background — paid by cash? Add it yourself.</p>
      <div className="yr-list">
        {trips.map((t, i) => <TicketStub trip={t} key={t.id} delay={i * 70} />)}
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: MILESTONE CARDS
   ============================================================ */
function StampBadge({ children }) {
  return <div className="yr-stamp">{children}</div>;
}

function MilestoneCard({ data }) {
  return (
    <div className="yr-postcard" key={data.label}>
      <div className="yr-postcard-inner">
        <div className="yr-postcard-top">
          <div>
            <div className="yr-postcard-kicker">{data.label} milestone</div>
            <div className="yr-postcard-ref">{data.ref}</div>
          </div>
          <StampBadge>
            <Leaf size={14} />
            <span className="yr-mono">+{data.ecoPoints}</span>
          </StampBadge>
        </div>

        <div className="yr-postcard-grid">
          {data.stats.map((s) => (
            <div className="yr-postcard-stat" key={s.label}>
              <div className="yr-mono yr-postcard-value">{s.value}</div>
              <div className="yr-postcard-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="yr-postcard-foot">
          <p>{data.headline}</p>
          <button className="yr-share-btn">
            <Share2 size={15} /> Share card
          </button>
        </div>
      </div>
      <div className="yr-postcard-edge" aria-hidden="true" />
    </div>
  );
}

function CardsScreen() {
  const [tab, setTab] = useState("trip");
  return (
    <div className="yr-screen">
      <ScreenHeader eyebrow="Shareable, made from your data" title="Milestone Cards" />
      <div className="yr-segment">
        {Object.keys(MILESTONES).map((k) => (
          <button
            key={k}
            className={`yr-segment-btn ${tab === k ? "is-active" : ""}`}
            onClick={() => setTab(k)}
          >
            {MILESTONES[k].label}
          </button>
        ))}
      </div>
      <Reveal key={tab} className="yr-postcard-wrap">
        <MilestoneCard data={MILESTONES[tab]} />
      </Reveal>
    </div>
  );
}

/* ============================================================
   SCREEN: COST + SWITCH SUGGESTION
   ============================================================ */
function CostScreen({ active, breakdown, onAddExpense }) {
  const costTotal = breakdown.reduce((s, c) => s + c.amount, 0);
  const total = useCountUp(costTotal, 1000, active);
  const maxAmount = Math.max(...breakdown.map((c) => c.amount), 1);
  return (
    <div className="yr-screen">
      <ScreenHeader
        eyebrow="Online payments are auto-detected • Cash expenses can be added manually"
        title="Travel Expenses"
        action={
          <button
            className="yr-header-btn"
            onClick={onAddExpense}
            title="Add cash travel expense"
          >
            💵 Paid by Cash?
          </button>
        }
      />

      <Reveal className="yr-cost-hero">
        <div className="yr-cost-label">Total travel spend · July</div>
        <div className="yr-mono yr-cost-total">₹{Math.round(total).toLocaleString("en-IN")}</div>
      </Reveal>

      <Reveal delay={80}>
        <div className="yr-bars">
          {breakdown.map((c, i) => {
            const pct = (c.amount / maxAmount) * 100;
            return (
              <div className="yr-bar-row" key={c.mode}>
                <span className="yr-bar-label">
                  {c.mode}
                  {c.cashAmount > 0 ? (
                    <span className="yr-source-tag yr-source-cash">
                      <Banknote size={9} /> cash
                    </span>
                  ) : (
                    <span className="yr-source-tag">auto</span>
                  )}
                </span>
                <div className="yr-bar-track">
                  <div
                    className="yr-bar-fill"
                    style={{ width: active ? `${pct}%` : "0%", transitionDelay: `${150 + i * 90}ms` }}
                  />
                </div>
                <span className="yr-mono yr-bar-amount">₹{c.amount}</span>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={260}>
        <div className="yr-suggestion">
          <div className="yr-suggestion-head">
            <TrendingDown size={18} />
            <span>Switch-and-save suggestion</span>
          </div>
          <div className="yr-suggestion-route">{SUGGESTION.route}</div>
          <p className="yr-suggestion-detail">{SUGGESTION.detail}</p>
          <div className="yr-suggestion-action">
            <ArrowUpRight size={16} />
            <strong>{SUGGESTION.action}</strong>
          </div>
          <div className="yr-suggestion-tags">
            <span className="yr-tag yr-tag-gold">Save {SUGGESTION.save}</span>
            <span className="yr-tag">{SUGGESTION.cost}</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ============================================================
   SCREEN: TRANSPARENCY DASHBOARD
   ============================================================ */
function TrustScreen() {
  return (
    <div className="yr-screen">
      <ScreenHeader eyebrow="What left your device, and when" title="Transparency Log" />
      <Reveal>
        <div className="yr-trust-banner">
          <ShieldCheck size={18} />
          <p>Raw GPS traces stay on your phone. Only rounded, anonymized summaries are shared for transport planning.</p>
        </div>
      </Reveal>
      <div className="yr-passport">
        {TRUST_LOG.map((e, i) => (
          <Reveal delay={i * 90} key={e.date}>
            <div className="yr-passport-row">
              <div className="yr-passport-stamp">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="yr-passport-date yr-mono">{e.date}</div>
                <div className="yr-passport-summary">{e.summary}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="yr-trust-foot">
        <Info size={13} />
        <span>Illustrative log — no data actually leaves this device.</span>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: SMART REMINDERS
   ============================================================ */
function ReminderCard({ kind, data, delay }) {
  const isAnomaly = kind === "anomaly";
  return (
    <Reveal delay={delay}>
      <div className={`yr-reminder ${isAnomaly ? "is-anomaly" : ""}`}>
        <div className="yr-reminder-icon">
          {isAnomaly ? <AlertTriangle size={18} /> : <Repeat size={18} />}
        </div>
        <div className="yr-reminder-body">
          <div className="yr-reminder-title">{data.title}</div>
          <p>{data.body}</p>
          <button className="yr-reminder-cta">
            {data.cta} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

function RemindersScreen() {
  return (
    <div className="yr-screen">
      <ScreenHeader eyebrow="Noticed for you" title="Smart Reminders" />
      <ReminderCard kind="pattern" data={REMINDERS.pattern} delay={0} />
      <ReminderCard kind="anomaly" data={REMINDERS.anomaly} delay={100} />
    </div>
  );
}

/* ============================================================
   SCREEN: REWARDS
   ============================================================ */
function RewardsScreen({ active }) {
  const points = useCountUp(REWARDS.points, 1100, active);
  const pct = Math.min(100, (REWARDS.points / REWARDS.nextAt) * 100);
  return (
    <div className="yr-screen">
      <ScreenHeader eyebrow="Earned by moving lighter" title="Rewards" />

      <Reveal className="yr-points-hero">
        <div className="yr-points-glow" />
        <Leaf size={22} />
        <div className="yr-mono yr-points-value">{Math.round(points).toLocaleString("en-IN")}</div>
        <div className="yr-points-label">eco-points</div>
        <div className="yr-tier-name">{TIERS[REWARDS.tierIndex]}</div>
      </Reveal>

      <Reveal delay={90}>
        <div className="yr-progress-wrap">
          <div className="yr-progress-track">
            <div className="yr-progress-fill" style={{ width: active ? `${pct}%` : "0%" }} />
          </div>
          <div className="yr-progress-labels">
            <span>{TIERS[REWARDS.tierIndex]}</span>
            <span>{REWARDS.nextAt - REWARDS.points} pts to {TIERS[REWARDS.tierIndex + 1]}</span>
          </div>
        </div>
      </Reveal>

      <div className="yr-perks">
        {REWARDS.perks.map((p, i) => (
          <Reveal delay={180 + i * 90} key={p.name}>
            <div className="yr-perk">
              <div className="yr-perk-icon"><Gift size={17} /></div>
              <div className="yr-perk-body">
                <div className="yr-perk-name">{p.name}</div>
                <div className="yr-perk-offer">{p.offer}</div>
              </div>
              <span className="yr-tag yr-tag-tiny">{p.tag}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ADD CASH EXPENSE MODAL
   ============================================================ */
function AddExpenseModal({ onClose, onSave }) {
  const [mode, setMode] = useState("Bus");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [fare, setFare] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!from.trim() || !to.trim()) {
      setError("Add both a start and end point.");
      return;
    }
    if (!fare || Number(fare) <= 0) {
      setError("Enter the amount you paid.");
      return;
    }
    const now = new Date();
    onSave({
      id: Date.now(),
      mode,
      route: [from.trim(), to.trim()],
      date: now.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      day: now.toLocaleDateString("en-IN", { weekday: "short" }),
      distance: distance ? Number(distance) : 0,
      time: "—",
      fare: Number(fare),
      cash: true,
    });
  };

  return (
    <div className="yr-modal-overlay" onClick={onClose}>
      <div className="yr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="yr-modal-header">
          <div>
            <div className="yr-eyebrow">Paid by cash</div>
            <h3 className="yr-modal-title">Add a trip</h3>
          </div>
          <button className="yr-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="yr-form-group">
          <label className="yr-form-label">Mode</label>
          <div className="yr-mode-picker">
            {Object.keys(MODES).map((m) => {
              const Icon = MODES[m].icon;
              return (
                <button
                  key={m}
                  className={`yr-mode-chip ${mode === m ? "is-active" : ""}`}
                  onClick={() => setMode(m)}
                  type="button"
                >
                  <Icon size={14} />
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="yr-form-row">
          <div className="yr-form-group">
            <label className="yr-form-label">From</label>
            <input
              className="yr-form-input"
              placeholder="e.g. Kaloor"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="yr-form-group">
            <label className="yr-form-label">To</label>
            <input
              className="yr-form-input"
              placeholder="e.g. Vytila"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="yr-form-row">
          <div className="yr-form-group">
            <label className="yr-form-label">Distance (km)</label>
            <input
              className="yr-form-input"
              type="number"
              inputMode="decimal"
              placeholder="Optional"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          <div className="yr-form-group">
            <label className="yr-form-label">Amount paid (₹)</label>
            <input
              className="yr-form-input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="yr-form-error">{error}</div>}

        <div className="yr-modal-actions">
          <button className="yr-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="yr-btn-primary" onClick={handleSave}>
            <Banknote size={15} /> Save trip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED
   ============================================================ */
function ScreenHeader({ eyebrow, title, action }) {
  return (
    <div className="yr-screen-head yr-screen-head-row">
      <div>
        <div className="yr-eyebrow">{eyebrow}</div>
        <h2 className="yr-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const TABS = [
  { key: "diary", label: "Diary", icon: BookOpen },
  { key: "cards", label: "Cards", icon: Sparkles },
  { key: "cost", label: "Cost", icon: Wallet },
  { key: "trust", label: "Trust", icon: ShieldCheck },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "rewards", label: "Rewards", icon: Award },
];

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [tab, setTab] = useState("diary");
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [costBreakdown, setCostBreakdown] = useState(INITIAL_COST_BREAKDOWN);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSaveExpense = (newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);

    const label = MODE_TO_COST_LABEL[newTrip.mode];
    if (label && newTrip.fare > 0) {
      setCostBreakdown((prev) => {
        const exists = prev.find((c) => c.mode === label);
        if (exists) {
          return prev.map((c) =>
            c.mode === label
              ? { ...c, amount: c.amount + newTrip.fare, cashAmount: c.cashAmount + newTrip.fare }
              : c
          );
        }
        return [...prev, { mode: label, amount: newTrip.fare, cashAmount: newTrip.fare }].sort(
          (a, b) => b.amount - a.amount
        );
      });
    }

    setShowAddModal(false);
    setToast("Cash trip added to your diary");
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="yr-page">
      <GlobalStyle />
      <div className="yr-phone">
        <div className="yr-notch" />
        <div className="yr-statusbar">
          <span className="yr-mono">9:41</span>
          <span className="yr-brand">
            <span className="yr-brand-mark">യ</span> Yathra
          </span>
          <span className="yr-mono">●●●</span>
        </div>

        <div className="yr-content" key={tab}>
          {tab === "diary" && <DiaryScreen trips={trips} onAddExpense={() => setShowAddModal(true)} />}
          {tab === "cards" && <CardsScreen />}
          {tab === "cost" && (
            <CostScreen
              active={tab === "cost"}
              breakdown={costBreakdown}
              onAddExpense={() => setShowAddModal(true)}
            />
          )}
          {tab === "trust" && <TrustScreen />}
          {tab === "alerts" && <RemindersScreen />}
          {tab === "rewards" && <RewardsScreen active={tab === "rewards"} />}
        </div>

        {toast && (
          <div className="yr-toast">
            <CheckCircle2 size={15} /> {toast}
          </div>
        )}

        {showAddModal && (
          <AddExpenseModal
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveExpense}
          />
        )}

        <nav className="yr-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                className={`yr-nav-btn ${isActive ? "is-active" : ""}`}
                onClick={() => setTab(t.key)}
                aria-label={t.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                <span>{t.label}</span>
                {isActive && <span className="yr-nav-dot" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="yr-caption">
        <strong>Yathra</strong> — travel data capture prototype · SIH 2025 · Kerala Travel &amp; Tourism
      </div>
    </div>
  );
}

/* ============================================================
   GLOBAL STYLE
   ============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

      * { box-sizing: border-box; }

      .yr-page {
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background:
          radial-gradient(ellipse 80% 60% at 20% -10%, rgba(231,165,55,0.10), transparent 60%),
          radial-gradient(ellipse 70% 50% at 100% 100%, rgba(193,80,46,0.10), transparent 60%),
          linear-gradient(160deg, ${C.teal800}, ${C.teal900} 70%);
        font-family: 'Manrope', sans-serif;
      }

      .yr-phone {
        position: relative;
        width: 390px;
        max-width: 100%;
        height: 780px;
        max-height: 92vh;
        background: linear-gradient(175deg, ${C.teal700}, ${C.teal800} 55%, ${C.teal900});
        border-radius: 42px;
        border: 1px solid rgba(231,165,55,0.22);
        box-shadow:
          0 30px 70px -20px rgba(0,0,0,0.6),
          0 0 0 8px rgba(9,37,35,0.6),
          inset 0 1px 0 rgba(247,239,221,0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: yrPhoneIn 900ms cubic-bezier(.16,1,.3,1) both;
      }
      @keyframes yrPhoneIn {
  0% {
    opacity: 0;
    transform: translateY(35px) scale(0.94);
  }

  70% {
    opacity: 1;
    transform: translateY(-4px) scale(1.01);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
      }

      .yr-notch {
        position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
        width: 96px; height: 20px; background: ${C.teal900};
        border-radius: 999px; z-index: 5;
      }

      .yr-statusbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 24px 6px; color: ${C.creamDim}; font-size: 11px; letter-spacing: 0.03em;
        flex-shrink: 0;
      }
      .yr-brand {
        display: flex; align-items: center; gap: 6px;
        font-family: 'Fraunces', serif; font-weight: 600; font-size: 14px; color: ${C.cream};
        letter-spacing: 0.01em;
      }
      .yr-brand-mark { color: ${C.gold}; font-size: 16px; }

      .yr-content {
        flex: 1; overflow-y: auto; padding: 6px 20px 18px;
        animation: yrFade 420ms ease both;
        scrollbar-width: none;
      }
      .yr-content::-webkit-scrollbar { display: none; }
      @keyframes yrFade {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .yr-screen { display: flex; flex-direction: column; gap: 14px; }
      .yr-screen-head { margin-top: 10px; margin-bottom: 2px; }
      .yr-eyebrow {
        font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.09em;
        text-transform: uppercase; color: ${C.gold}; opacity: 0.85; margin-bottom: 4px;
      }
      .yr-title {
        font-family: 'Fraunces', serif; font-weight: 600; font-size: 25px; color: ${C.cream};
        margin: 0; letter-spacing: -0.01em;
      }
      .yr-lede { color: ${C.creamDim}; font-size: 13px; line-height: 1.5; margin: 0 0 2px; opacity: 0.85; }

      .yr-mono { font-family: 'IBM Plex Mono', monospace; }

      .yr-reveal { animation: yrReveal 560ms cubic-bezier(.22,.9,.3,1) both; }
      @keyframes yrReveal {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* ---------- Trip Diary ticket stub ---------- */
      .yr-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 6px; }
      .yr-ticket {
        display: flex; border-radius: 16px; overflow: visible; position: relative;
        background: ${C.cream}; box-shadow: 0 8px 20px -10px rgba(0,0,0,0.45);
        transition: transform 220ms ease, box-shadow 220ms ease;
      }
      .yr-ticket:hover { transform: translateY(-3px); box-shadow: 0 14px 26px -10px rgba(0,0,0,0.55); }
      .yr-ticket-stub {
        width: 58px; flex-shrink: 0; border-radius: 16px 0 0 16px;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        padding: 10px 4px; position: relative;
      }
      .yr-ticket-date { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: ${C.ink}; }
      .yr-ticket-day { font-size: 9px; color: ${C.ink}; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; }
      .yr-ticket-perf {
        width: 0; position: relative; display: flex; flex-direction: column;
        justify-content: space-between; padding: 6px 0;
      }
      .yr-ticket-perf span {
        width: 9px; height: 9px; border-radius: 50%;
        background: ${C.teal900};
        margin-left: -4.5px;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
      }
      .yr-ticket-body { flex: 1; padding: 12px 14px 12px 16px; border-left: 1.5px dashed rgba(23,36,32,0.22); margin-left: 0; }
      .yr-ticket-route {
        display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px; color: ${C.ink};
        margin-bottom: 10px;
      }
      .yr-route-line { color: ${C.terracotta}; display: flex; align-items: center; }
      .yr-ticket-meta { display: flex; gap: 18px; }
      .yr-ticket-meta div { display: flex; flex-direction: column; gap: 2px; }
      .yr-ticket-meta span { font-size: 12.5px; font-weight: 600; color: ${C.ink}; }
      .yr-ticket-meta em { font-size: 9.5px; font-style: normal; text-transform: uppercase; letter-spacing: 0.06em; color: ${C.ink}; opacity: 0.5; }

      /* ---------- Milestone cards ---------- */
      .yr-segment {
        display: flex; background: rgba(9,37,35,0.5); border: 1px solid rgba(231,165,55,0.18);
        border-radius: 12px; padding: 3px; gap: 3px;
      }
      .yr-segment-btn {
        flex: 1; border: none; background: transparent; color: ${C.creamDim};
        font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; padding: 8px 6px;
        border-radius: 9px; cursor: pointer; transition: all 200ms ease;
      }
      .yr-segment-btn.is-active { background: ${C.gold}; color: ${C.ink}; box-shadow: 0 4px 12px -4px rgba(231,165,55,0.5); }

      .yr-postcard-wrap { margin-top: 4px; }
      .yr-postcard {
        position: relative; border-radius: 20px; padding: 3px;
        background: linear-gradient(135deg, ${C.gold}, ${C.terracotta});
      }
      .yr-postcard-inner {
        background: ${C.cream}; border-radius: 17px; padding: 20px;
        background-image: repeating-linear-gradient(135deg, rgba(23,36,32,0.025) 0 2px, transparent 2px 14px);
      }
      .yr-postcard-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
      .yr-postcard-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: ${C.terracotta}; }
      .yr-postcard-ref { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: ${C.ink}; margin-top: 3px; }
      .yr-stamp {
        display: flex; align-items: center; gap: 5px; border: 1.5px dashed ${C.terracotta};
        border-radius: 10px; padding: 5px 9px; color: ${C.terracotta}; font-weight: 700; font-size: 12px;
        transform: rotate(4deg);
      }
      .yr-postcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; margin-bottom: 16px; }
      .yr-postcard-value { font-size: 18px; font-weight: 600; color: ${C.ink}; }
      .yr-postcard-label { font-size: 10.5px; color: ${C.ink}; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
      .yr-postcard-foot { border-top: 1px dashed rgba(23,36,32,0.25); padding-top: 14px; }
      .yr-postcard-foot p { font-size: 13px; color: ${C.ink}; margin: 0 0 12px; font-weight: 500; }
      .yr-share-btn {
        display: flex; align-items: center; gap: 7px; background: ${C.ink}; color: ${C.cream};
        border: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 12.5px;
        cursor: pointer; width: 100%; justify-content: center; transition: transform 180ms ease, background 180ms ease;
      }
      .yr-share-btn:hover { transform: translateY(-2px); background: ${C.teal800}; }

      /* ---------- Cost screen ---------- */
      .yr-cost-hero {
        background: linear-gradient(140deg, ${C.teal600}, ${C.teal700});
        border: 1px solid rgba(231,165,55,0.2); border-radius: 16px; padding: 18px 20px;
      }
      .yr-cost-label { font-size: 11.5px; color: ${C.creamDim}; opacity: 0.75; margin-bottom: 6px; }
      .yr-cost-total { font-size: 30px; font-weight: 600; color: ${C.gold}; }

      .yr-bars { display: flex; flex-direction: column; gap: 12px; background: rgba(9,37,35,0.4); border-radius: 14px; padding: 16px; border: 1px solid rgba(247,239,221,0.06); }
      .yr-bar-row { display: grid; grid-template-columns: 66px 1fr 52px; align-items: center; gap: 10px; }
      .yr-bar-label { font-size: 11.5px; color: ${C.creamDim}; }
      .yr-bar-track { height: 8px; border-radius: 999px; background: rgba(247,239,221,0.08); overflow: hidden; }
      .yr-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${C.gold}, ${C.terracottaSoft}); transition: width 900ms cubic-bezier(.22,.9,.3,1); }
      .yr-bar-amount { font-size: 11.5px; color: ${C.cream}; text-align: right; }

      .yr-suggestion {
        border: 1px solid rgba(193,80,46,0.4); background: rgba(193,80,46,0.12);
        border-radius: 16px; padding: 16px 18px;
      }
      .yr-suggestion-head { display: flex; align-items: center; gap: 7px; color: ${C.terracottaSoft}; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }
      .yr-suggestion-route { font-family: 'Fraunces', serif; font-size: 17px; color: ${C.cream}; font-weight: 600; margin-bottom: 6px; }
      .yr-suggestion-detail { font-size: 12.5px; color: ${C.creamDim}; margin: 0 0 12px; line-height: 1.5; }
      .yr-suggestion-action { display: flex; align-items: center; gap: 6px; color: ${C.cream}; font-size: 14px; margin-bottom: 12px; }
      .yr-suggestion-tags { display: flex; gap: 8px; flex-wrap: wrap; }
      .yr-tag {
        font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; padding: 5px 10px; border-radius: 999px;
        background: rgba(247,239,221,0.1); color: ${C.creamDim}; border: 1px solid rgba(247,239,221,0.12);
      }
      .yr-tag-gold { background: rgba(231,165,55,0.18); color: ${C.gold}; border-color: rgba(231,165,55,0.35); font-weight: 600; }
      .yr-tag-tiny { font-size: 9.5px; padding: 4px 8px; }

      /* ---------- Trust screen ---------- */
      .yr-trust-banner {
        display: flex; gap: 10px; align-items: flex-start; background: rgba(41,107,92,0.25);
        border: 1px solid rgba(41,107,92,0.5); border-radius: 14px; padding: 14px 16px; color: ${C.creamDim};
      }
      .yr-trust-banner svg { color: ${C.gold}; flex-shrink: 0; margin-top: 1px; }
      .yr-trust-banner p { margin: 0; font-size: 12.5px; line-height: 1.5; }

      .yr-passport { display: flex; flex-direction: column; }
      .yr-passport-row {
        display: flex; gap: 12px; align-items: flex-start; padding: 13px 4px;
        border-bottom: 1px dashed rgba(247,239,221,0.14);
      }
      .yr-passport-stamp {
        width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid ${C.gold};
        display: flex; align-items: center; justify-content: center; color: ${C.gold}; flex-shrink: 0;
      }
      .yr-passport-date { font-size: 11px; color: ${C.gold}; margin-bottom: 3px; }
      .yr-passport-summary { font-size: 12.5px; color: ${C.creamDim}; line-height: 1.5; }
      .yr-trust-foot { display: flex; align-items: center; gap: 6px; color: ${C.creamDim}; opacity: 0.55; font-size: 11px; margin-top: 4px; }

      /* ---------- Reminders ---------- */
      .yr-reminder {
        display: flex; gap: 12px; padding: 16px; border-radius: 16px;
        background: rgba(41,107,92,0.2); border: 1px solid rgba(41,107,92,0.45);
      }
      .yr-reminder.is-anomaly { background: rgba(193,80,46,0.14); border-color: rgba(193,80,46,0.4); }
      .yr-reminder-icon {
        width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        background: ${C.teal500}; color: ${C.cream};
      }
      .is-anomaly .yr-reminder-icon { background: ${C.terracotta}; }
      .yr-reminder-title { font-weight: 700; color: ${C.cream}; font-size: 13.5px; margin-bottom: 5px; }
      .yr-reminder-body p { font-size: 12.5px; color: ${C.creamDim}; line-height: 1.5; margin: 0 0 10px; }
      .yr-reminder-cta {
        display: flex; align-items: center; gap: 4px; background: none; border: none; color: ${C.gold};
        font-weight: 700; font-size: 12px; cursor: pointer; padding: 0;
      }
      .is-anomaly .yr-reminder-cta { color: ${C.terracottaSoft}; }

      /* ---------- Rewards ---------- */
      .yr-points-hero {
        position: relative; overflow: hidden; text-align: center; padding: 26px 16px 22px;
        background: linear-gradient(160deg, ${C.teal600}, ${C.teal800});
        border-radius: 18px; border: 1px solid rgba(231,165,55,0.25);
        display: flex; flex-direction: column; align-items: center; gap: 2px; color: ${C.gold};
      }
      .yr-points-glow {
        position: absolute; width: 180px; height: 180px; border-radius: 50%;
        background: radial-gradient(circle, rgba(231,165,55,0.35), transparent 70%);
        top: -70px; left: 50%; transform: translateX(-50%); animation: yrGlow 3.4s ease-in-out infinite;
      }
      @keyframes yrGlow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      .yr-points-value { font-size: 34px; font-weight: 600; color: ${C.cream}; margin-top: 6px; position: relative; }
      .yr-points-label { font-size: 11px; color: ${C.creamDim}; text-transform: uppercase; letter-spacing: 0.08em; position: relative; }
      .yr-tier-name { margin-top: 8px; font-family: 'Fraunces', serif; font-size: 14px; color: ${C.gold}; font-weight: 600; position: relative; }

      .yr-progress-wrap { display: flex; flex-direction: column; gap: 8px; }
      .yr-progress-track { height: 10px; border-radius: 999px; background: rgba(247,239,221,0.08); overflow: hidden; }
      .yr-progress-fill {
        height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${C.terracottaSoft}, ${C.gold});
        transition: width 1100ms cubic-bezier(.22,.9,.3,1);
      }
      .yr-progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: ${C.creamDim}; opacity: 0.8; }

      .yr-perks { display: flex; flex-direction: column; gap: 10px; }
      .yr-perk {
        display: flex; align-items: center; gap: 12px; padding: 13px 14px; border-radius: 14px;
        background: rgba(247,239,221,0.05); border: 1px solid rgba(247,239,221,0.09);
        transition: transform 200ms ease, background 200ms ease;
      }
      .yr-perk:hover { transform: translateY(-2px); background: rgba(247,239,221,0.09); }
      .yr-perk-icon {
        width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(231,165,55,0.16); color: ${C.gold};
      }
      .yr-perk-body { flex: 1; min-width: 0; }
      .yr-perk-name { font-size: 13px; font-weight: 700; color: ${C.cream}; }
      .yr-perk-offer { font-size: 11.5px; color: ${C.creamDim}; margin-top: 2px; }

      /* ---------- Cash badge on ticket ---------- */
      .yr-cash-badge {
        display: inline-flex; align-items: center; gap: 3px; margin-left: 4px;
        font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.04em; color: ${C.terracotta};
        background: rgba(193,80,46,0.12); border: 1px solid rgba(193,80,46,0.3);
        border-radius: 999px; padding: 2px 6px 2px 5px;
      }

      /* ---------- Floating add button ---------- */
      .yr-fab {
        position: absolute; right: 22px; bottom: 88px; width: 50px; height: 50px;
        border-radius: 50%; border: none; cursor: pointer; z-index: 20;
        background: linear-gradient(135deg, ${C.gold}, ${C.terracottaSoft});
        color: ${C.ink}; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 24px -8px rgba(231,165,55,0.65), 0 0 0 6px rgba(9,37,35,0.5);
        transition: transform 200ms ease, box-shadow 200ms ease;
      }
      .yr-fab:hover { transform: translateY(-2px) scale(1.04); }
      .yr-fab:active { transform: scale(0.96); }

      .yr-add-cash-link {
        display: none;
      }

      .yr-screen-head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .yr-header-btn {
        display: flex; align-items: center; gap: 5px; flex-shrink: 0; margin-top: 2px;
        background: linear-gradient(135deg, ${C.gold}, ${C.terracottaSoft}); color: ${C.ink};
        border: none; border-radius: 999px; padding: 8px 13px; font-size: 12px; font-weight: 700;
        cursor: pointer; transition: transform 180ms ease, filter 180ms ease;
      }
      .yr-header-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }

      .yr-source-tag {
        display: inline-flex; align-items: center; gap: 3px; margin-left: 6px;
        font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; text-transform: uppercase;
        letter-spacing: 0.05em; color: ${C.creamDim}; opacity: 0.55;
      }
      .yr-source-cash {
        color: ${C.terracotta}; opacity: 1; background: rgba(193,80,46,0.12);
        border: 1px solid rgba(193,80,46,0.3); border-radius: 999px; padding: 2px 6px 2px 5px;
      }

      /* ---------- Toast ---------- */
      .yr-toast {
        position: absolute; left: 50%; bottom: 92px; transform: translateX(-50%);
        display: flex; align-items: center; gap: 7px; background: ${C.ink}; color: ${C.cream};
        padding: 10px 16px; border-radius: 999px; font-size: 12px; font-weight: 600;
        box-shadow: 0 12px 26px -10px rgba(0,0,0,0.6); z-index: 25; white-space: nowrap;
        animation: yrToastIn 260ms cubic-bezier(.22,.9,.3,1) both;
      }
      .yr-toast svg { color: ${C.gold}; flex-shrink: 0; }
      @keyframes yrToastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

      /* ---------- Add expense modal ---------- */
      .yr-modal-overlay {
        position: absolute; inset: 0; background: rgba(9,20,18,0.72); backdrop-filter: blur(2px);
        display: flex; align-items: flex-end; z-index: 30; animation: yrFade 200ms ease both;
      }
      .yr-modal {
        width: 100%; background: linear-gradient(175deg, ${C.teal700}, ${C.teal900});
        border-top: 1px solid rgba(231,165,55,0.25); border-radius: 22px 22px 0 0;
        padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 14px;
        max-height: 88%; overflow-y: auto;
        animation: yrModalIn 280ms cubic-bezier(.22,.9,.3,1) both;
      }
      @keyframes yrModalIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      .yr-modal-header { display: flex; align-items: flex-start; justify-content: space-between; }
      .yr-modal-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; color: ${C.cream}; margin: 2px 0 0; }
      .yr-modal-close {
        background: rgba(247,239,221,0.08); border: none; color: ${C.creamDim}; width: 30px; height: 30px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
      }

      .yr-form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
      .yr-form-row { display: flex; gap: 10px; }
      .yr-form-label {
        font-family: 'IBM Plex Mono', monospace; font-size: 10px; text-transform: uppercase;
        letter-spacing: 0.06em; color: ${C.creamDim}; opacity: 0.7;
      }
      .yr-form-input {
        background: rgba(247,239,221,0.06); border: 1px solid rgba(247,239,221,0.14);
        border-radius: 12px; padding: 11px 13px; color: ${C.cream}; font-size: 14px;
        font-family: 'Manrope', sans-serif; outline: none; transition: border-color 160ms ease;
      }
      .yr-form-input:focus { border-color: ${C.gold}; }
      .yr-form-input::placeholder { color: ${C.creamDim}; opacity: 0.4; }

      .yr-mode-picker { display: flex; flex-wrap: wrap; gap: 8px; }
      .yr-mode-chip {
        display: flex; align-items: center; gap: 6px; background: rgba(247,239,221,0.06);
        border: 1px solid rgba(247,239,221,0.14); color: ${C.creamDim}; border-radius: 999px;
        padding: 8px 13px; font-size: 12px; font-weight: 600; cursor: pointer;
        transition: all 180ms ease;
      }
      .yr-mode-chip.is-active { background: ${C.gold}; border-color: ${C.gold}; color: ${C.ink}; }

      .yr-form-error {
        color: ${C.terracottaSoft}; font-size: 12px; background: rgba(193,80,46,0.12);
        border: 1px solid rgba(193,80,46,0.35); border-radius: 10px; padding: 8px 12px;
      }

      .yr-modal-actions { display: flex; gap: 10px; margin-top: 4px; }
      .yr-btn-secondary, .yr-btn-primary {
        flex: 1; border: none; border-radius: 12px; padding: 12px; font-weight: 700; font-size: 13.5px;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
        transition: transform 180ms ease, filter 180ms ease;
      }
      .yr-btn-secondary { background: rgba(247,239,221,0.08); color: ${C.creamDim}; }
      .yr-btn-primary { background: linear-gradient(135deg, ${C.gold}, ${C.terracottaSoft}); color: ${C.ink}; }
      .yr-btn-secondary:hover, .yr-btn-primary:hover { transform: translateY(-1px); filter: brightness(1.05); }

      /* ---------- Bottom nav ---------- */
      .yr-nav {
        display: flex; padding: 8px 8px 14px; gap: 2px; flex-shrink: 0;
        background: rgba(9,37,35,0.85); border-top: 1px solid rgba(231,165,55,0.14);
        backdrop-filter: blur(6px);
      }
      .yr-nav-btn {
        flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
        background: none; border: none; color: ${C.creamDim}; opacity: 0.55; padding: 7px 2px 5px;
        cursor: pointer; position: relative; transition: all 200ms ease; border-radius: 10px;
      }
      .yr-nav-btn span:not(.yr-nav-dot) { font-size: 9.5px; font-weight: 600; }
      .yr-nav-btn.is-active { color: ${C.gold}; opacity: 1; transform: translateY(-2px); }
      .yr-nav-dot { position: absolute; bottom: -1px; width: 4px; height: 4px; border-radius: 50%; background: ${C.gold}; }

      .yr-caption {
        margin-top: 20px; color: ${C.creamDim}; opacity: 0.5; font-size: 11.5px; text-align: center; max-width: 380px;
      }
      .yr-caption strong { color: ${C.gold}; opacity: 1; }

      @media (max-width: 420px) {
        .yr-phone { border-radius: 0; height: 100vh; max-height: 100vh; width: 100vw; border: none; }
        .yr-page { padding: 0; }
        .yr-caption { display: none; }
        animation: phoneEnter .7s ease-out;
      }
        @keyframes phoneEnter {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
    `}</style>
  );
}