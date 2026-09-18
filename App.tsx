import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  Filter,
  Lightbulb,
  ListFilter,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  X,
  Smartphone,
  UserRound,
  ShieldCheck,
} from 'lucide-react';

type Expense = {
  date: string;
  description: string;
  category: string;
  amount: number;
};
type Page = 'overview' | 'expenses' | 'insights' | 'analytics' | 'budget' | 'savings' | 'subscriptions' | 'calendar' | 'challenges' | 'reports' | 'settings';

const CATEGORY_RULES: Record<string, string[]> = {
  Food: [
    'food',
    'grocery',
    'groceries',
    'restaurant',
    'mess',
    'cafe',
    'coffee',
    'lunch',
    'dinner',
    'breakfast',
    'snack',
    'zomato',
    'swiggy',
  ],
  Transport: [
    'transport',
    'bus',
    'metro',
    'uber',
    'ola',
    'cab',
    'auto',
    'fuel',
    'petrol',
    'travel',
    'train',
  ],
  Education: [
    'education',
    'college',
    'course',
    'book',
    'books',
    'tuition',
    'exam',
    'fee',
    'fees',
    'stationery',
    'study',
  ],
  Shopping: [
    'shopping',
    'clothes',
    'clothing',
    'amazon',
    'flipkart',
    'fashion',
    'purchase',
  ],
  Entertainment: [
    'entertainment',
    'movie',
    'cinema',
    'netflix',
    'spotify',
    'game',
    'gaming',
    'concert',
  ],
  Bills: [
    'bill',
    'bills',
    'rent',
    'electricity',
    'recharge',
    'internet',
    'wifi',
    'phone',
    'mobile',
  ],
  Healthcare: [
    'health',
    'hospital',
    'doctor',
    'medicine',
    'medical',
    'pharmacy',
    'clinic',
  ],
};

const sampleExpenses: Expense[] = [
  {
    date: '2026-09-02',
    description: 'College canteen lunch',
    category: 'Food',
    amount: 180,
  },
  {
    date: '2026-09-04',
    description: 'Metro recharge',
    category: 'Transport',
    amount: 500,
  },
  {
    date: '2026-09-06',
    description: 'Data structures book',
    category: 'Education',
    amount: 650,
  },
  {
    date: '2026-09-08',
    description: 'Groceries',
    category: 'Food',
    amount: 920,
  },
  {
    date: '2026-09-11',
    description: 'T-shirt',
    category: 'Shopping',
    amount: 850,
  },
  {
    date: '2026-09-13',
    description: 'Movie',
    category: 'Entertainment',
    amount: 320,
  },
  {
    date: '2026-09-15',
    description: 'Mobile recharge',
    category: 'Bills',
    amount: 399,
  },
];

function normalizeCategory(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) return 'Other';
  const known = Object.keys(CATEGORY_RULES).find(
    category => category.toLowerCase() === clean
  );
  if (known) return known;
  for (const [category, words] of Object.entries(CATEGORY_RULES)) {
    if (words.some(word => clean.includes(word))) return category;
  }
  return 'Other';
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(/₹|rs\.?|inr|,/gi, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function splitLine(line: string) {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes('|')) return line.split('|');
  return line.split(',');
}

function parseText(text: string): { rows: Expense[]; error?: string } {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], error: 'The file is empty.' };
  const first = splitLine(lines[0]).map(v => v.trim().toLowerCase());
  const hasHeader = first.some(v =>
    ['date', 'description', 'category', 'amount', 'expense', 'type'].includes(v)
  );
  const start = hasHeader ? 1 : 0;
  const header = hasHeader ? first : [];
  const idx = (names: string[], fallback: number) => {
    const found = names.map(name => header.indexOf(name)).find(i => i >= 0);
    return found ?? fallback;
  };
  const dateIdx = idx(['date'], 0);
  const descIdx = idx(['description', 'expense', 'item', 'name'], 1);
  const catIdx = idx(['category', 'type'], 2);
  const amountIdx = idx(
    ['amount', 'cost', 'value', 'spent'],
    hasHeader ? 3 : 2
  );
  const rows: Expense[] = [];
  for (let i = start; i < lines.length; i += 1) {
    const parts = splitLine(lines[i]).map(v =>
      v.trim().replace(/^['\"]|['\"]$/g, '')
    );
    if (parts.length < 2) continue;
    const amount = parseAmount(parts[amountIdx] ?? '');
    if (amount === null || amount < 0) continue;
    const description = parts[descIdx] || parts[1] || 'Expense';
    const rawCategory = parts[catIdx] || '';
    const rawDate = parts[dateIdx] || '';
    rows.push({
      date: rawDate,
      description,
      category: normalizeCategory(rawCategory || description),
      amount,
    });
  }
  if (!rows.length)
    return {
      rows: [],
      error:
        'We could not find valid expense rows. Use columns such as Date, Description, Category and Amount.',
    };
  return { rows };
}

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function SpendWiseLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`spendwise-logo ${compact ? 'compact' : ''}`} aria-label="SpendWise logo">
      <div className="logo-orbit"><span /></div>
      <div className="logo-wordmark">
        <strong>Spend<span>Wise</span></strong>
        {!compact && <small>STUDENT MONEY, SIMPLIFIED</small>}
      </div>
    </div>
  );
}

function SignInGate({ onSignedIn }: { onSignedIn: (profile: { name: string; phone: string }) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');

  const requestOtp = () => {
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setStep('otp');
    setError('');
  };

  const verifyOtp = () => {
    if (otp !== sentOtp) {
      setError('That verification code is not correct. Try again.');
      return;
    }
    onSignedIn({ name: name.trim(), phone });
  };

  return (
    <div className="auth-screen">
      <div className="auth-aurora aurora-left" />
      <div className="auth-aurora aurora-right" />
      <div className="auth-grid" />
      <div className="auth-brand"><SpendWiseLogo /></div>
      <main className="auth-card">
        <div className="auth-card-glow" />
        <div className="auth-topline"><span>SPENDWISE</span><b>01 / 02</b></div>
        <div className="auth-icon"><UserRound size={21} /></div>
        <span className="eyebrow">YOUR MONEY, YOUR SPACE</span>
        <h1>{step === 'details' ? 'Welcome to SpendWise.' : 'One last step.'}</h1>
        <p>{step === 'details' ? 'Tell us a little about you. Your profile stays in this browser.' : `We created a verification code for +91 ${phone}.`}</p>

        {step === 'details' ? (
          <div className="auth-form">
            <label><span>Your name</span><div className="auth-input"><UserRound size={17} /><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riddhima" /></div></label>
            <label><span>Mobile number</span><div className="auth-input"><Smartphone size={17} /><b>+91</b><input inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="10-digit number" /></div></label>
            <button className="auth-primary" onClick={requestOtp}>Get verification code <ChevronRight size={18} /></button>
            <div className="auth-trust"><ShieldCheck size={15} /><span>Private by design · stored locally in this browser</span></div>
          </div>
        ) : (
          <div className="auth-form">
            <div className="otp-demo"><small>YOUR DEMO VERIFICATION CODE</small><strong>{sentOtp}</strong><span>No SMS is sent in this browser-only version.</span></div>
            <label><span>Enter 6-digit code</span><div className="auth-input otp-input"><Smartphone size={17} /><input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="000000" /></div></label>
            <button className="auth-primary" onClick={verifyOtp}>Enter SpendWise <ChevronRight size={18} /></button>
            <button className="auth-back" onClick={() => { setStep('details'); setOtp(''); setError(''); }}>← Change number</button>
          </div>
        )}
        {error && <div className="auth-error">{error}</div>}
        <small className="auth-footer">No password. No unnecessary setup. Just your spending space.</small>
      </main>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('overview');
  const [showIntro, setShowIntro] = useState(() => {
    try { return sessionStorage.getItem('spendwise-intro-seen') !== '1'; } catch { return true; }
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(() => {
    try {
      const saved = localStorage.getItem('spendwise-profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [budget, setBudget] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [dragging, setDragging] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [manualExpense, setManualExpense] = useState({ date: new Date().toISOString().slice(0, 10), description: '', category: 'Food', amount: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(
    () => expenses.reduce((sum, row) => sum + row.amount, 0),
    [expenses]
  );
  const average = expenses.length ? total / expenses.length : 0;
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(row =>
      map.set(row.category, (map.get(row.category) ?? 0) + row.amount)
    );
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const topCategory = categoryTotals[0]?.[0] ?? '—';
  const maxCategory = categoryTotals[0]?.[1] ?? 0;
  const filteredExpenses = useMemo(
    () =>
      expenses.filter(row => {
        const matchesSearch = `${row.description} ${row.category} ${row.date}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || row.category === filter;
        return matchesSearch && matchesFilter;
      }),
    [expenses, filter, search]
  );
  const budgetValue = Number(budget) || 0;
  const remaining = budgetValue - total;
  const budgetUsed = budgetValue
    ? Math.min((total / budgetValue) * 100, 100)
    : 0;

  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => {
      setShowIntro(false);
      try { sessionStorage.setItem('spendwise-intro-seen', '1'); } catch { /* ignore */ }
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spendwise-expenses');
      const savedBudget = localStorage.getItem('spendwise-budget');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setExpenses(parsed);
      }
      if (savedBudget) setBudget(savedBudget);
    } catch {
      // Ignore malformed local browser state and start clean.
    }
  }, []);

  useEffect(() => {
    if (expenses.length) localStorage.setItem('spendwise-expenses', JSON.stringify(expenses));
    else localStorage.removeItem('spendwise-expenses');
  }, [expenses]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (budget) localStorage.setItem('spendwise-budget', budget);
    else localStorage.removeItem('spendwise-budget');
  }, [budget]);

  const openAddExpense = () => {
    setEditingIndex(null);
    setManualExpense({ date: new Date().toISOString().slice(0, 10), description: '', category: 'Food', amount: '' });
    setShowAddExpense(true);
  };

  const saveManualExpense = () => {
    const amount = Number(manualExpense.amount);
    if (!manualExpense.description.trim() || !manualExpense.date || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a description, date and amount greater than ₹0.');
      return;
    }
    const next: Expense = { date: manualExpense.date, description: manualExpense.description.trim(), category: normalizeCategory(manualExpense.category), amount };
    setExpenses(current => {
      if (editingIndex === null) return [...current, next];
      return current.map((row, index) => index === editingIndex ? next : row);
    });
    setFileName(fileName || 'manually-added-expenses');
    setShowAddExpense(false);
    setError('');
  };

  const editExpense = (index: number) => {
    const row = expenses[index];
    setEditingIndex(index);
    setManualExpense({ date: row.date, description: row.description, category: row.category, amount: String(row.amount) });
    setShowAddExpense(true);
  };

  const deleteExpense = (index: number) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    setExpenses(current => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const exportCsv = () => {
    if (!expenses.length) return;
    const csv = ['Date,Description,Category,Amount', ...expenses.map(row => [row.date, row.description, row.category, row.amount].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spendwise-expenses.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (!window.confirm('Clear all expenses and return to the start screen?')) return;
    setExpenses([]);
    setFileName('');
    setSearch('');
    setFilter('All');
    setBudget('');
    setPage('overview');
  };

  const analyzeFile = (file: File) => {
    setError('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt'].includes(extension ?? '')) {
      setError('Please upload a valid CSV or TXT file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseText(String(reader.result ?? ''));
      if (result.error) {
        setExpenses([]);
        setFileName('');
        setError(result.error);
        return;
      }
      setExpenses(result.rows);
      setFileName(file.name);
      setPage('overview');
    };
    reader.onerror = () => setError("We couldn't analyze this file.");
    reader.readAsText(file);
  };

  const useSample = () => {
    setExpenses(sampleExpenses);
    setFileName('sample-student-expenses.csv');
    setError('');
    setPage('overview');
  };

  const goTo = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
  };
  const hasData = expenses.length > 0;

  const handleSignedIn = (nextProfile: { name: string; phone: string }) => {
    setProfile(nextProfile);
    localStorage.setItem('spendwise-profile', JSON.stringify(nextProfile));
  };

  const signOut = () => {
    setProfile(null);
    localStorage.removeItem('spendwise-profile');
    setPage('overview');
  };

  const observations = useMemo(() => {
    if (!hasData) return [];
    const items: string[] = [];
    if (categoryTotals.length)
      items.push(
        `${topCategory} is your largest expense category at ${formatRupees(maxCategory)}.`
      );
    if (categoryTotals.length >= 3) {
      const topThree = categoryTotals
        .slice(0, 3)
        .reduce((sum, [, value]) => sum + value, 0);
      if (total && topThree / total >= 0.6)
        items.push(
          `Your top three categories account for ${Math.round((topThree / total) * 100)}% of total spending.`
        );
    }
    const dated = expenses.filter(row => row.date);
    if (dated.length >= 3) {
      const midpoint = Math.ceil(dated.length / 2);
      const firstHalf = dated
        .slice(0, midpoint)
        .reduce((sum, row) => sum + row.amount, 0);
      const secondHalf = dated
        .slice(midpoint)
        .reduce((sum, row) => sum + row.amount, 0);
      if (secondHalf > firstHalf * 1.15)
        items.push(
          'Spending is higher in the later part of the available date range.'
        );
      else if (firstHalf > secondHalf * 1.15)
        items.push(
          'Spending is higher in the earlier part of the available date range.'
        );
    }
    if (!items.length)
      items.push(
        'Your expenses are distributed across the categories found in the uploaded data.'
      );
    return items;
  }, [categoryTotals, expenses, hasData, maxCategory, topCategory, total]);

  const suggestions = useMemo(() => {
    if (!hasData) return [];
    const result: string[] = [];
    if (topCategory !== '—')
      result.push(
        `${topCategory} is currently your largest spending area. Review this category if you want to reduce monthly spending.`
      );
    if (categoryTotals.length >= 2)
      result.push(
        `Your two largest categories make up ${Math.round(((categoryTotals[0][1] + categoryTotals[1][1]) / total) * 100)}% of total spending.`
      );
    if (budgetValue && remaining < 0)
      result.push(
        `Your recorded spending is ${formatRupees(Math.abs(remaining))} above the monthly budget you entered.`
      );
    else if (budgetValue && remaining >= 0)
      result.push(
        `You have ${formatRupees(remaining)} remaining from the monthly budget you entered.`
      );
    return result;
  }, [budgetValue, categoryTotals, hasData, remaining, topCategory, total]);

  return (
    <>
      {showIntro && (
        <div className="opening-screen" role="status" aria-label="Opening SpendWise">
          <div className="opening-glow glow-one" />
          <div className="opening-glow glow-two" />
          <div className="opening-center">
            <SpendWiseLogo />
            <div className="opening-line"><span /></div>
            <p>YOUR MONEY. YOUR STORY. YOUR CONTROL.</p>
          </div>
        </div>
      )}
      {!profile ? <SignInGate onSignedIn={handleSignedIn} /> : null}
      <div className={`app-shell ${profile ? '' : 'is-locked'}`}>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark spendwise-mark"><SpendWiseLogo compact /></div>
          <div>
            <strong>SpendWise</strong>
            <span>Student Expense Analyzer</span>
          </div>
        </div>
        <nav>
          <span className="nav-label">MAIN</span>
          <button className={page === 'overview' ? 'active' : ''} onClick={() => goTo('overview')}><BarChart3 size={18} /> Overview</button>
          <button className={page === 'expenses' ? 'active' : ''} onClick={() => goTo('expenses')}><ListFilter size={18} /> Expenses</button>
          <button className={page === 'analytics' ? 'active' : ''} onClick={() => goTo('analytics')}><TrendingUp size={18} /> Analytics</button>
          <span className="nav-label">PLAN</span>
          <button className={page === 'budget' ? 'active' : ''} onClick={() => goTo('budget')}><Wallet size={18} /> Budget</button>
          <button className={page === 'savings' ? 'active' : ''} onClick={() => goTo('savings')}><CircleDollarSign size={18} /> Savings Goals</button>
          <button className={page === 'subscriptions' ? 'active' : ''} onClick={() => goTo('subscriptions')}><RotateCcw size={18} /> Subscriptions</button>
          <button className={page === 'calendar' ? 'active' : ''} onClick={() => goTo('calendar')}><FileSpreadsheet size={18} /> Calendar</button>
          <span className="nav-label">DISCOVER</span>
          <button className={page === 'challenges' ? 'active' : ''} onClick={() => goTo('challenges')}><Sparkles size={18} /> Challenges</button>
          <button className={page === 'insights' ? 'active' : ''} onClick={() => goTo('insights')}><Lightbulb size={18} /> Insights</button>
          <button className={page === 'reports' ? 'active' : ''} onClick={() => goTo('reports')}><Download size={18} /> Reports</button>
          <span className="nav-label">SYSTEM</span>
          <button className={page === 'settings' ? 'active' : ''} onClick={() => goTo('settings')}><Filter size={18} /> Settings</button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="upload-nav"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={17} /> Upload New Data
          </button>
          <p>Private by design · Data is processed in your browser.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <div className="mobile-brand">
            <div className="brand-mark spendwise-mark"><SpendWiseLogo compact /></div>
          </div>
          <div className="topbar-spacer" />
          <div className="profile-chip">
            <span><UserRound size={14} /></span>
            <strong>{profile?.name}</strong>
            <button onClick={signOut} title="Sign out">Sign out</button>
          </div>
          <div className="status-dot" /> Local analysis
        </header>

        {!hasData ? (
          <section className="landing">
            <div className="hero-copy">
              <div className="hero-brandline"><SpendWiseLogo compact /><span>BUILT FOR STUDENT LIFE</span></div>
              <span className="eyebrow">
                <Sparkles size={14} /> Simple money clarity for students
              </span>
              <h1>
                Understand Your Spending.
                <br />
                <em>Take Control</em> of Your Student Budget.
              </h1>
              <p>
                Upload your monthly expenses and turn your spending data into
                simple, meaningful insights.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => inputRef.current?.click()}
                >
                  Analyze My Expenses <ChevronRight size={18} />
                </button>
                <button className="ghost-btn" onClick={useSample}>
                  Try sample data
                </button>
              </div>
              <div className="student-proof">
                <span><b>01</b> Track every rupee</span>
                <span><b>02</b> See the patterns</span>
                <span><b>03</b> Build better habits</span>
              </div>
              <div className="feature-row">
                <div>
                  <span>
                    <TrendingUp size={16} />
                  </span>
                  <strong>Track</strong>
                  <small>Understand where your money is going.</small>
                </div>
                <div>
                  <span>
                    <BarChart3 size={16} />
                  </span>
                  <strong>Analyze</strong>
                  <small>Discover major spending areas and patterns.</small>
                </div>
                <div>
                  <span>
                    <Lightbulb size={16} />
                  </span>
                  <strong>Improve</strong>
                  <small>Get simple suggestions from your data.</small>
                </div>
              </div>
            </div>
            <div className="hero-preview">
              <div className="preview-orbit orbit-a" />
              <div className="preview-orbit orbit-b" />
              <div className="preview-window">
                <div className="preview-head">
                  <span>Spending Overview</span>
                  <span className="preview-pill">Illustrative</span>
                </div>
                <div className="preview-total">
                  <small>Total spending</small>
                  <strong>₹18,450</strong>
                  <span>Sample preview only</span>
                </div>
                <div className="preview-bars">
                  <i style={{ height: '72%' }} />
                  <i style={{ height: '48%' }} />
                  <i style={{ height: '61%' }} />
                  <i style={{ height: '35%' }} />
                  <i style={{ height: '54%' }} />
                  <i style={{ height: '82%' }} />
                  <i style={{ height: '42%' }} />
                </div>
                <div className="preview-list">
                  <span>
                    <b /> Food <strong>34%</strong>
                  </span>
                  <span>
                    <b /> Transport <strong>18%</strong>
                  </span>
                  <span>
                    <b /> Education <strong>14%</strong>
                  </span>
                </div>
              </div>
              <div className="floating-card">
                <CircleDollarSign size={19} />
                <div>
                  <small>Budget health</small>
                  <strong>Stay intentional</strong>
                </div>
              </div>
            </div>
            <div className="landing-note"><Sparkles size={14} /> Private by design · Your expense data stays in this browser</div>
            <div
              className={`dropzone ${dragging ? 'dragging' : ''}`}
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) analyzeFile(file);
              }}
              onClick={() => inputRef.current?.click()}
            >
              <div className="upload-icon">
                <Upload />
              </div>
              <strong>Drop your CSV or TXT file here</strong>
              <span>
                or <u>Browse Files</u>
              </span>
              <small>CSV • TXT · We process your file locally</small>
            </div>
          </section>
        ) : (
          <section className="dashboard">
            <div className="page-heading">
              <div>
                <span className="eyebrow">{fileName}</span>
                <h1>{({overview:'Your Spending Overview',expenses:'All Expenses',insights:'Smart Insights',analytics:'Spending Analytics',budget:'Smart Budget Planner',savings:'Savings Goals',subscriptions:'Subscription Tracker',calendar:'Spending Calendar',challenges:'Student Challenges',reports:'Reports & Export Center',settings:'Settings'} as Record<Page,string>)[page]}</h1>
                <p>{({overview:'A simple breakdown of your monthly expenses.',expenses:'Search, filter and review every uploaded transaction.',insights:'Clear observations and suggestions based only on your uploaded data.',analytics:'See the patterns behind your spending.',budget:'Build a practical budget around your real spending.',savings:'Turn small monthly habits into visible goals.',subscriptions:'Keep recurring costs visible before they surprise you.',calendar:'Explore spending intensity day by day.',challenges:'Build better habits with small, measurable challenges.',reports:'Create clean summaries from your recorded data.',settings:'Manage preferences and browser-stored data.'} as Record<Page,string>)[page]}</p>
              </div>
              <div className="heading-actions">
                <button className="secondary-btn" onClick={openAddExpense}>
                  <Plus size={16} /> Add expense
                </button>
                <button className="secondary-btn" onClick={exportCsv} title="Download your current data as CSV">
                  <Download size={16} /> Export
                </button>
                <button className="secondary-btn" onClick={() => inputRef.current?.click()}>
                  <Upload size={16} /> New upload
                </button>
              </div>
            </div>
            {page === 'overview' && (
              <>
                <div className="money-story">
                  <div className="story-copy">
                    <span className="story-kicker"><Sparkles size={13} /> YOUR MONEY STORY</span>
                    <h2>Most of your recorded spend is going to <strong>{topCategory}</strong>.</h2>
                    <p>{Math.round((maxCategory / total) * 100)}% of your spending sits in your top category. See the full picture below.</p>
                  </div>
                  <div className="story-ring" style={{ background: `conic-gradient(#7df0b0 ${Math.round((maxCategory / total) * 100)}%, rgba(255,255,255,.12) 0)` }}>
                    <div><strong>{Math.round((maxCategory / total) * 100)}%</strong><span>top area</span></div>
                  </div>
                  <div className="story-spark spark-one" />
                  <div className="story-spark spark-two" />
                </div>
                <div className="stat-grid">
                  <Stat
                    icon={<CircleDollarSign />}
                    label="Total Spending"
                    value={formatRupees(total)}
                  />
                  <Stat
                    icon={<FileSpreadsheet />}
                    label="Transactions"
                    value={String(expenses.length)}
                  />
                  <Stat
                    icon={<TrendingUp />}
                    label="Top Spending Area"
                    value={topCategory}
                  />
                  <Stat
                    icon={<Wallet />}
                    label="Average Expense"
                    value={formatRupees(average)}
                  />
                </div>
                <VisualStory expenses={expenses} categoryTotals={categoryTotals} total={total} />
                <div className="content-grid">
                  <section className="panel chart-panel">
                    <div className="panel-head">
                      <div>
                        <h2>Where Does Your Money Go?</h2>
                        <p>Category-wise share of your recorded spending</p>
                      </div>
                      <span className="mini-label">
                        {categoryTotals.length} categories
                      </span>
                    </div>
                    <CategoryChart data={categoryTotals} total={total} />
                  </section>
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Your Biggest Spending Areas</h2>
                        <p>Ranked by amount</p>
                      </div>
                    </div>
                    <div className="rank-list">
                      {categoryTotals
                        .slice(0, 5)
                        .map(([category, amount], index) => (
                          <div
                            className={`rank-item ${index === 0 ? 'featured' : ''}`}
                            key={category}
                          >
                            <span className="rank-num">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="rank-copy">
                              <strong>{category}</strong>
                              <small>
                                {Math.round((amount / total) * 100)}% of total
                              </small>
                            </div>
                            <strong className="rank-amount">
                              {formatRupees(amount)}
                            </strong>
                          </div>
                        ))}
                      {!categoryTotals.length && <Empty />}
                    </div>
                  </section>
                </div>
                <div className="content-grid bottom-grid">
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Spending Patterns</h2>
                        <p>Observations from the available data</p>
                      </div>
                    </div>
                    <div className="observation-list">
                      {observations.map(item => (
                        <div key={item}>
                          <span>
                            <TrendingUp size={16} />
                          </span>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="panel insight-panel">
                    <div className="insight-title">
                      <span>
                        <Sparkles size={16} />
                      </span>
                      <div>
                        <h2>Smart Insights</h2>
                        <p>Simple, data-based suggestions</p>
                      </div>
                    </div>
                    <div className="suggestion-list">
                      {suggestions.map(item => (
                        <p key={item}>{item}</p>
                      ))}
                      {!suggestions.length && (
                        <p>
                          Upload enough expense data to generate suggestions.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
                <BudgetCard
                  budget={budget}
                  setBudget={setBudget}
                  total={total}
                  remaining={remaining}
                  budgetUsed={budgetUsed}
                />
                <section className="quick-actions panel">
                  <div>
                    <span className="eyebrow">Take action</span>
                    <h2>Keep your money log alive</h2>
                    <p>Add one-off expenses, export a copy for your records, or start a fresh analysis.</p>
                  </div>
                  <div className="quick-action-buttons">
                    <button className="primary-btn compact" onClick={openAddExpense}><Plus size={16} /> Add expense</button>
                    <button className="secondary-btn" onClick={exportCsv}><Download size={16} /> Export CSV</button>
                    <button className="danger-btn" onClick={clearAll}><RotateCcw size={16} /> Clear data</button>
                  </div>
                </section>
              </>
            )}
            {page === 'expenses' && (
              <ExpenseTable
                rows={filteredExpenses}
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
                categories={categoryTotals.map(([category]) => category)}
                allRows={expenses}
                onEdit={editExpense}
                onDelete={deleteExpense}
              />
            )}
            {page === 'insights' && <InsightsPage observations={observations} suggestions={suggestions} categoryTotals={categoryTotals} total={total} />}
            {page !== 'overview' && page !== 'expenses' && page !== 'insights' && <AdvancedPage page={page} expenses={expenses} total={total} categoryTotals={categoryTotals} budget={budget} setBudget={setBudget} exportCsv={exportCsv} clearAll={clearAll} />}
          </section>
        )}

        {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onGo={goTo} onAdd={openAddExpense} />}
        {hasData && <button className="floating-add" onClick={openAddExpense}><Plus size={19} /><span>Add expense</span></button>}
        {showAddExpense && (
          <div className="modal-backdrop" onMouseDown={() => setShowAddExpense(false)}>
            <div className="expense-modal" onMouseDown={e => e.stopPropagation()}>
              <div className="modal-head">
                <div><span className="eyebrow">Quick entry</span><h2>{editingIndex === null ? 'Add an expense' : 'Edit expense'}</h2></div>
                <button className="icon-btn" onClick={() => setShowAddExpense(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <div className="form-grid">
                <label>Date<input type="date" value={manualExpense.date} onChange={e => setManualExpense({ ...manualExpense, date: e.target.value })} /></label>
                <label>Category<select value={manualExpense.category} onChange={e => setManualExpense({ ...manualExpense, category: e.target.value })}>{['Food','Transport','Education','Shopping','Entertainment','Bills','Healthcare','Other'].map(item => <option key={item}>{item}</option>)}</select></label>
                <label className="full-field">Description<input autoFocus value={manualExpense.description} onChange={e => setManualExpense({ ...manualExpense, description: e.target.value })} placeholder="e.g. College canteen lunch" /></label>
                <label className="full-field">Amount<input inputMode="decimal" value={manualExpense.amount} onChange={e => setManualExpense({ ...manualExpense, amount: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="250" /></label>
              </div>
              <div className="modal-actions"><button className="secondary-btn" onClick={() => setShowAddExpense(false)}>Cancel</button><button className="primary-btn compact" onClick={saveManualExpense}>{editingIndex === null ? 'Add expense' : 'Save changes'}</button></div>
            </div>
          </div>
        )}

        {error && (
          <div className="toast error">
            <X size={17} />
            <span>
              <strong>We couldn't analyze this file.</strong>
              {error}
            </span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) analyzeFile(file);
            e.currentTarget.value = '';
          }}
        />
      </main>
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CategoryChart({
  data,
  total,
}: {
  data: [string, number][];
  total: number;
}) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(([, value]) => value));
  return (
    <div className="category-chart">
      <div className="bar-chart">
        {data.map(([category, value]) => (
          <div className="bar-col" key={category}>
            <span>{formatRupees(value)}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${Math.max((value / max) * 100, 8)}%` }}
              />
            </div>
            <small>{category}</small>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        {data.map(([category, value]) => (
          <span key={category}>
            <i />
            {category}
            <b>{Math.round((value / total) * 100)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function VisualStory({
  expenses,
  categoryTotals,
  total,
}: {
  expenses: Expense[];
  categoryTotals: [string, number][];
  total: number;
}) {
  const recent = expenses.slice(-8);
  const max = Math.max(...recent.map(row => row.amount), 1);
  const donut = categoryTotals.slice(0, 5).map(([, value]) => total ? (value / total) * 360 : 0);
  let angle = 0;
  const stops = donut.map((size, index) => {
    const start = angle;
    angle += size;
    const alpha = 0.82 - index * 0.09;
    return `rgba(55,200,128,${Math.max(alpha, 0.38)}) ${start}deg ${angle}deg`;
  });
  const donutStyle = stops.length ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#e8efeb 0deg 360deg)';

  return (
    <section className="visual-story-grid">
      <div className="visual-card pulse-card">
        <div className="visual-card-head">
          <div>
            <span className="eyebrow">SPENDING PULSE</span>
            <h2>Your recent money rhythm</h2>
          </div>
          <span className="visual-badge"><TrendingUp size={13} /> Live from your data</span>
        </div>
        <div className="pulse-chart" aria-label="Recent spending visualization">
          <div className="chart-grid-lines"><i /><i /><i /><i /></div>
          {recent.map((row, index) => (
            <div className="pulse-column" key={`${row.date}-${row.description}-${index}`}>
              <span className="pulse-value">{formatRupees(row.amount)}</span>
              <span className="pulse-dot" />
              <div className="pulse-track"><i style={{ height: `${Math.max((row.amount / max) * 100, 8)}%` }} /></div>
              <small>{row.date ? row.date.slice(8) : String(index + 1)}</small>
            </div>
          ))}
        </div>
        <div className="pulse-footer"><span><b /> Lower</span><span><b className="violet-dot" /> Higher</span><strong>{recent.length} recent records</strong></div>
      </div>
      <div className="visual-card mix-card">
        <div className="visual-card-head">
          <div>
            <span className="eyebrow">MONEY MIX</span>
            <h2>How your spend is split</h2>
          </div>
          <CircleDollarSign size={18} />
        </div>
        <div className="donut-wrap">
          <div className="mix-total-label"><span>THIS DATASET</span><strong>{categoryTotals.length} categories</strong></div>
          <div className="donut" style={{ background: donutStyle }}><div><strong>{formatRupees(total)}</strong><span>total spend</span></div></div>
          <div className="mix-list">
            {categoryTotals.slice(0, 5).map(([category, value], index) => (
              <div key={category}><span><i className={`mix-dot mix-${index}`} />{category}</span><b>{Math.round((value / total) * 100)}%</b></div>
            ))}
            {!categoryTotals.length && <span className="muted-note">Add expenses to build your money mix.</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function BudgetCard({
  budget,
  setBudget,
  total,
  remaining,
  budgetUsed,
}: {
  budget: string;
  setBudget: (v: string) => void;
  total: number;
  remaining: number;
  budgetUsed: number;
}) {
  return (
    <section className="panel budget-panel">
      <div>
        <span className="eyebrow">Optional</span>
        <h2>Monthly Budget</h2>
        <p>Set a target to see how your recorded spending compares.</p>
      </div>
      <div className="budget-input-wrap">
        <span>₹</span>
        <input
          inputMode="numeric"
          value={budget}
          onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="20,000"
          aria-label="Monthly budget"
        />
      </div>
      {Number(budget) > 0 && (
        <div className="budget-result">
          <div className="budget-numbers">
            <span>
              Budget <b>{formatRupees(Number(budget))}</b>
            </span>
            <span>
              Spent <b>{formatRupees(total)}</b>
            </span>
            <span className={remaining < 0 ? 'over' : 'good'}>
              {remaining < 0 ? 'Budget exceeded' : 'Remaining'}{' '}
              <b>{formatRupees(Math.abs(remaining))}</b>
            </span>
          </div>
          <div className="progress">
            <div style={{ width: `${budgetUsed}%` }} />
          </div>
          <small>
            {Math.round((total / Number(budget)) * 100)}% of budget used
          </small>
        </div>
      )}
    </section>
  );
}

function ExpenseTable({
  rows,
  search,
  setSearch,
  filter,
  setFilter,
  categories,
  allRows,
  onEdit,
  onDelete,
}: {
  rows: Expense[];
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  categories: string[];
  allRows: Expense[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  const indexForRow = (row: Expense, visibleIndex: number) => {
    const exact = allRows.findIndex(item => item === row);
    return exact >= 0 ? exact : visibleIndex;
  };
  return (
    <section className="panel table-panel">
      <div className="toolbar">
        <div className="table-meta"><strong>{rows.length}</strong> shown <span>·</span> {allRows.length} total</div>
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses..."
          />
        </div>
        <div className="filter-box">
          <Filter size={16} />
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option>
            {categories.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="amount-cell">Amount</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.date}-${row.description}-${index}`}>
                <td>{row.date || '—'}</td>
                <td>
                  <strong>{row.description}</strong>
                </td>
                <td>
                  <span className="category-chip">{row.category}</span>
                </td>
                <td className="amount-cell">{formatRupees(row.amount)}</td>
                <td className="actions-cell">
                  <button className="table-icon" onClick={() => onEdit(indexForRow(row, index))} title="Edit expense" aria-label="Edit expense"><Pencil size={15} /></button>
                  <button className="table-icon danger" onClick={() => onDelete(indexForRow(row, index))} title="Delete expense" aria-label="Delete expense"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>
    </section>
  );
}

function InsightsPage({
  observations,
  suggestions,
  categoryTotals,
  total,
}: {
  observations: string[];
  suggestions: string[];
  categoryTotals: [string, number][];
  total: number;
}) {
  return (
    <div className="insights-page">
      <section className="insight-hero">
        <div className="insight-orb">
          <Sparkles />
        </div>
        <div>
          <span className="eyebrow">Based on your uploaded data</span>
          <h2>Your spending, made easier to understand.</h2>
          <p>
            SpendWise turns your transaction list into a concise summary without
            adding assumptions beyond the data.
          </p>
        </div>
      </section>
      <div className="insight-columns">
        <InsightCard title="Spending Summary" icon={<CircleDollarSign />}>
          <p>
            You recorded {formatRupees(total)} across{' '}
            {categoryTotals.reduce((sum, [, value]) => sum + 1, 0)} spending
            categories and{' '}
            {categoryTotals.length
              ? 'have a clear category breakdown to review.'
              : 'can add more categorized expenses for deeper analysis.'}
          </p>
        </InsightCard>
        <InsightCard title="Major Expense Areas" icon={<BarChart3 />}>
          {categoryTotals.slice(0, 4).map(([category, value], index) => (
            <div className="insight-rank" key={category}>
              <span>{index + 1}</span>
              <strong>{category}</strong>
              <b>{formatRupees(value)}</b>
            </div>
          ))}
        </InsightCard>
        <InsightCard title="Spending Patterns" icon={<TrendingUp />}>
          {observations.map(item => (
            <p className="bullet-line" key={item}>
              {item}
            </p>
          ))}
        </InsightCard>
        <InsightCard title="Budget Suggestions" icon={<Lightbulb />}>
          {suggestions.map(item => (
            <p className="bullet-line" key={item}>
              {item}
            </p>
          ))}
        </InsightCard>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel insight-card">
      <div className="card-title">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <div className="empty">
      <div>
        <FileSpreadsheet size={21} />
      </div>
      <strong>No data to display</strong>
      <p>Upload a valid CSV or TXT expense file to continue.</p>
    </div>
  );
}

function CommandPalette({ onClose, onGo, onAdd }: { onClose: () => void; onGo: (page: Page) => void; onAdd: () => void }) {
  const actions: [string, Page | 'add'][] = [['Open Overview','overview'],['Open Expenses','expenses'],['Open Analytics','analytics'],['Open Budget','budget'],['Open Savings Goals','savings'],['Open Subscriptions','subscriptions'],['Open Calendar','calendar'],['Open Challenges','challenges'],['Open Insights','insights'],['Open Reports','reports'],['Open Settings','settings'],['Add an expense','add']];
  return <div className="command-backdrop" onMouseDown={onClose}><div className="command-palette" onMouseDown={e => e.stopPropagation()}><div className="command-search"><Search size={18}/><input autoFocus placeholder="Type an action…" /></div><div className="command-list">{actions.map(([label,target]) => <button key={label} onClick={() => { onClose(); target === 'add' ? onAdd() : onGo(target); }}><span>{label}</span><ChevronRight size={15}/></button>)}</div><small>Ctrl + K to open · Esc to close</small></div></div>;
}

function AdvancedPage({ page, expenses, total, categoryTotals, budget, setBudget, exportCsv, clearAll }: { page: Exclude<Page,'overview'|'expenses'|'insights'>; expenses: Expense[]; total: number; categoryTotals: [string,number][]; budget: string; setBudget: (v:string)=>void; exportCsv: ()=>void; clearAll: ()=>void }) {
  const [goals, setGoals] = useState<{name:string;target:number;current:number;date:string}[]>(() => { try { return JSON.parse(localStorage.getItem('spendwise-goals') || '[]'); } catch { return []; } });
  const [subs, setSubs] = useState<{name:string;amount:number;cycle:string;next:string}[]>(() => { try { return JSON.parse(localStorage.getItem('spendwise-subs') || '[]'); } catch { return []; } });
  useEffect(() => localStorage.setItem('spendwise-goals', JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem('spendwise-subs', JSON.stringify(subs)), [subs]);
  const days = expenses.map(e => new Date(e.date)).filter(d => !Number.isNaN(d.getTime()));
  const byDay = new Map<string,number>(); expenses.forEach(e => byDay.set(e.date,(byDay.get(e.date)||0)+e.amount));
  const highest = [...byDay.entries()].sort((a,b)=>b[1]-a[1])[0];
  const weekdays = expenses.filter(e => { const d=new Date(e.date).getDay(); return d>0 && d<6; }).reduce((s,e)=>s+e.amount,0);
  const weekends = expenses.filter(e => { const d=new Date(e.date).getDay(); return d===0 || d===6; }).reduce((s,e)=>s+e.amount,0);
  const score = Math.max(35, Math.min(98, 72 + (budget && Number(budget)>0 ? (Number(budget)>=total ? 12 : -15) : 0) + (goals.length ? 8 : 0)));
  const title = page === 'analytics' ? 'Analytics Lab' : page === 'budget' ? 'Budget Studio' : page === 'savings' ? 'Savings Goals' : page === 'subscriptions' ? 'Recurring Money' : page === 'calendar' ? 'Your Spending Calendar' : page === 'challenges' ? 'Small challenges. Real progress.' : page === 'reports' ? 'Export your money story' : 'Control center';
  if (page === 'analytics') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">ANALYTICS LAB</span><h2>{title}</h2><p>Patterns calculated directly from your recorded transactions.</p></section><div className="health-grid"><div className="health-card"><small>Financial Health</small><strong>{score}<span>/100</span></strong><div className="health-ring" style={{background:`conic-gradient(#72e9a8 ${score}%,#e9edf0 0)`}}><i>{score}</i></div><p>Educational signal based on budget, goals and recorded consistency.</p></div><div className="metric-stack"><div><span>Average transaction</span><b>{formatRupees(expenses.length ? total/expenses.length : 0)}</b></div><div><span>Weekday spend</span><b>{formatRupees(weekdays)}</b></div><div><span>Weekend spend</span><b>{formatRupees(weekends)}</b></div><div><span>Highest day</span><b>{highest ? formatRupees(highest[1]) : '—'}</b></div></div></div><section className="advanced-card"><div className="section-title"><div><span className="eyebrow">TOP CATEGORIES</span><h3>Where the month is going</h3></div><span className="count-pill">{categoryTotals.length} categories</span></div>{categoryTotals.slice(0,7).map(([c,v])=><div className="analytic-row" key={c}><span>{c}</span><div><i style={{width:`${total ? v/total*100 : 0}%`}} /></div><b>{formatRupees(v)}</b></div>)}</section></div>;
  if (page === 'budget') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">BUDGET STUDIO</span><h2>{title}</h2><p>Set a monthly ceiling and keep your plan visible.</p></section><section className="advanced-card budget-studio"><div><small>Monthly budget</small><div className="big-money">₹ <input value={budget} onChange={e=>setBudget(e.target.value.replace(/[^0-9]/g,''))} placeholder="25000" /></div><p>{budget && Number(budget)>0 ? `${formatRupees(total)} used · ${formatRupees(Math.max(0,Number(budget)-total))} remaining` : 'Add a budget to unlock your spending runway.'}</p></div><div className="runway"><div style={{width:`${budget && Number(budget)>0 ? Math.min(total/Number(budget)*100,100):0}%`}} /></div><div className="budget-status">{budget && Number(budget)>0 ? (total>Number(budget) ? 'Over budget' : total/Number(budget)>.8 ? 'Watch spending' : 'On track') : 'No budget set'}</div></section><div className="coach-grid"><div className="coach-card"><span>💡</span><div><strong>Money Coach</strong><p>{total ? `Your biggest category is ${categoryTotals[0]?.[0] || 'Other'}. Review it before making your next discretionary purchase.` : 'Add transactions to unlock personalized guidance.'}</p></div></div><div className="coach-card"><span>🎯</span><div><strong>Suggested split</strong><p>Try reserving a fixed amount for essentials first, then give yourself a clear discretionary limit.</p></div></div></div></div>;
  if (page === 'savings') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">SAVINGS GOALS</span><h2>{title}</h2><p>Make progress visible, one milestone at a time.</p></section><GoalCreator onAdd={g=>setGoals([...goals,g])}/><div className="goal-grid">{goals.length ? goals.map((g,i)=><div className="goal-card" key={`${g.name}-${i}`}><div className="goal-top"><span>GOAL {String(i+1).padStart(2,'0')}</span><button onClick={()=>setGoals(goals.filter((_,x)=>x!==i))}>×</button></div><h3>{g.name}</h3><strong>{formatRupees(g.current)} <small>/ {formatRupees(g.target)}</small></strong><div className="goal-progress"><i style={{width:`${Math.min(g.current/g.target*100,100)}%`}}/></div><p>{Math.round(Math.min(g.current/g.target*100,100))}% complete · target {g.date || 'no date'}</p></div>) : <EmptyGoal />}</div></div>;
  if (page === 'subscriptions') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">SUBSCRIPTIONS</span><h2>{title}</h2><p>Keep recurring costs visible and easy to review.</p></section><SubscriptionCreator onAdd={s=>setSubs([...subs,s])}/><div className="subscription-summary"><div><small>Monthly</small><strong>{formatRupees(subs.reduce((s,x)=>s+x.amount,0))}</strong></div><div><small>Estimated yearly</small><strong>{formatRupees(subs.reduce((s,x)=>s+x.amount,0)*12)}</strong></div><div><small>Active subscriptions</small><strong>{subs.length}</strong></div></div><div className="subscription-list">{subs.length ? subs.map((s,i)=><div className="sub-row" key={`${s.name}-${i}`}><div><strong>{s.name}</strong><small>{s.cycle} · next {s.next || 'not set'}</small></div><b>{formatRupees(s.amount)}</b><button onClick={()=>setSubs(subs.filter((_,x)=>x!==i))}>Remove</button></div>) : <EmptyGoal text="No subscriptions yet" sub="Add recurring services to see your monthly money-out."/>}</div></div>;
  if (page === 'calendar') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">SPENDING CALENDAR</span><h2>{title}</h2><p>Every recorded day has a spending signal.</p></section><div className="calendar-grid">{Array.from({length:Math.max(1, new Date().getDate())},(_,i)=>{const key=`2026-09-${String(i+1).padStart(2,'0')}`; const amount=byDay.get(key)||0; return <div className={`day-cell ${amount>Math.max(total/Math.max(expenses.length,1)*2,500)?'hot':amount?'warm':'quiet'}`} key={key}><small>{i+1}</small><strong>{amount?formatRupees(amount).replace('₹','₹'): '—'}</strong></div>})}</div><div className="calendar-legend"><span><i className="quiet"/> Low</span><span><i className="warm"/> Normal</span><span><i className="hot"/> High</span></div></div>;
  if (page === 'challenges') { const challengeData=[['No-Spend Weekend','Keep discretionary spending at ₹0 on a weekend.',weekends===0],['Track Everything','Record at least 7 expenses.',expenses.length>=7],['Know Your Top 3','Review your three largest categories.',categoryTotals.length>=3],['Create a Goal','Add your first savings target.',goals.length>0]]; return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">STUDENT CHALLENGES</span><h2>{title}</h2><p>Small, realistic habits that make your money easier to understand.</p></section><div className="challenge-grid">{challengeData.map(([name,desc,done])=><div className={`challenge-card ${done?'done':''}`} key={name as string}><span>{done?'✓':'○'}</span><div><strong>{name}</strong><p>{desc}</p></div><em>{done?'Complete':'In progress'}</em></div>)}</div><section className="badge-strip"><span>✦</span><div><strong>Achievement shelf</strong><p>{expenses.length ? 'First Step unlocked · Data Detective progress active.' : 'Add your first expense to unlock First Step.'}</p></div></section></div>; }
  if (page === 'reports') return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">REPORTS</span><h2>{title}</h2><p>Turn your recorded data into a portable snapshot.</p></section><div className="report-grid"><div className="report-card"><span>CSV</span><h3>All expenses</h3><p>Download every recorded transaction.</p><button onClick={exportCsv}><Download size={16}/> Export CSV</button></div><div className="report-card"><span>SUMMARY</span><h3>Monthly snapshot</h3><p>{formatRupees(total)} across {expenses.length} transactions and {categoryTotals.length} categories.</p><button onClick={()=>window.print()}>Print report</button></div><div className="report-card"><span>RESET</span><h3>Start fresh</h3><p>Clear local data after a confirmation.</p><button className="danger-btn" onClick={clearAll}>Clear data</button></div></div></div>;
  return <div className="advanced-page"><section className="feature-hero"><span className="eyebrow">SETTINGS</span><h2>{title}</h2><p>SpendWise stores your data in this browser.</p></section><div className="settings-grid"><div className="setting-card"><strong>Privacy</strong><p>Analysis happens locally in your browser. No account is required.</p></div><div className="setting-card"><strong>Keyboard</strong><p>Use Ctrl + K to open the command center from anywhere.</p></div><div className="setting-card"><strong>Data management</strong><p>Export a CSV from Reports, or clear all stored expenses when you are done.</p></div></div></div>;
}

function GoalCreator({onAdd}:{onAdd:(g:{name:string;target:number;current:number;date:string})=>void}) { const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [current,setCurrent]=useState(''); const [date,setDate]=useState(''); return <div className="creator-card"><div><span className="eyebrow">NEW GOAL</span><h3>What are you saving for?</h3></div><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. New laptop"/><input value={target} onChange={e=>setTarget(e.target.value.replace(/[^0-9]/g,''))} placeholder="Target ₹"/><input value={current} onChange={e=>setCurrent(e.target.value.replace(/[^0-9]/g,''))} placeholder="Saved ₹"/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><button className="primary-btn compact" onClick={()=>{if(name.trim()&&Number(target)>0){onAdd({name:name.trim(),target:Number(target),current:Number(current)||0,date});setName('');setTarget('');setCurrent('');setDate('');}}}><Plus size={16}/> Add goal</button></div> }
function SubscriptionCreator({onAdd}:{onAdd:(s:{name:string;amount:number;cycle:string;next:string})=>void}) { const [name,setName]=useState(''); const [amount,setAmount]=useState(''); const [cycle,setCycle]=useState('Monthly'); const [next,setNext]=useState(''); return <div className="creator-card"><div><span className="eyebrow">NEW SUBSCRIPTION</span><h3>Track a recurring payment</h3></div><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Spotify"/><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))} placeholder="Amount ₹"/><select value={cycle} onChange={e=>setCycle(e.target.value)}><option>Monthly</option><option>Weekly</option><option>Yearly</option></select><input type="date" value={next} onChange={e=>setNext(e.target.value)}/><button className="primary-btn compact" onClick={()=>{if(name.trim()&&Number(amount)>0){onAdd({name:name.trim(),amount:Number(amount),cycle,next});setName('');setAmount('');setNext('');}}}><Plus size={16}/> Add subscription</button></div> }
function EmptyGoal({text='No savings goals yet',sub='Create a goal to start turning your plans into visible progress.'}:{text?:string;sub?:string}) { return <div className="empty-feature"><div>◎</div><strong>{text}</strong><p>{sub}</p></div> }

export default App;
