import React from 'react';
import { Button, Typography, Space, Tag } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// ── Shared design tokens (mirrors app design system) ──────────────────────
const C = {
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryBorder: '#E0E7FF',
  mint: '#10B981',
  mintLight: '#ECFDF5',
  mintBorder: '#A7F3D0',
  lavender: '#A78BFA',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

// ── Logo mark (same as Layout) ─────────────────────────────────────────────
const LogoMark: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect x="2" y="2" width="16" height="16" rx="4"
      fill={C.primary} fillOpacity="0.15" stroke={C.primary} strokeWidth="1.5" />
    <rect x="10" y="10" width="16" height="16" rx="4"
      fill={C.mint} fillOpacity="0.15" stroke={C.mint} strokeWidth="1.5" />
  </svg>
);

// ── SVG icon helpers ───────────────────────────────────────────────────────
const IconBox: React.FC<{ children: React.ReactNode; color: string; bg: string; border: string }> = ({ children, color, bg, border }) => (
  <div style={{
    width: 44, height: 44, borderRadius: 10,
    background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </div>
);

const IconCloud = () => (
  <IconBox color={C.primary} bg={C.primaryLight} border={C.primaryBorder}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </IconBox>
);
const IconShield = () => (
  <IconBox color={C.mint} bg={C.mintLight} border={C.mintBorder}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </IconBox>
);
const IconLayers = () => (
  <IconBox color="#7C3AED" bg="#F5F3FF" border="#DDD6FE">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </IconBox>
);
const IconSearch = () => (
  <IconBox color="#D97706" bg="#FFFBEB" border="#FDE68A">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBox>
);
const IconTerminal = () => (
  <IconBox color={C.primary} bg={C.primaryLight} border={C.primaryBorder}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </IconBox>
);
const IconCheck = ({ color = C.mint }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Section wrapper ────────────────────────────────────────────────────────
const Section: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <section style={{
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    ...style,
  }}>
    {children}
  </section>
);

// ── Navbar ─────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <LogoMark />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text, letterSpacing: '-0.02em' }}>
            SkillVault
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Docs', href: '#' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                padding: '6px 14px', borderRadius: 8,
                color: C.textSecondary, fontSize: 14, fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = C.text;
                (e.currentTarget as HTMLElement).style.background = C.divider;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = C.textSecondary;
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth CTA */}
        <Space size={8}>
          <Link to="/login">
            <Button style={{ borderRadius: 8, fontWeight: 500, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button type="primary" style={{ borderRadius: 8, fontWeight: 600 }}>
              Get Started
            </Button>
          </Link>
        </Space>
      </div>
    </header>
  );
};

// ── Animated Terminal ──────────────────────────────────────────────────────
const TERMINAL_SCRIPT = [
  {
    cmd: 'skillvault login --server https://vault.example.com',
    output: [
      { text: '✓ Authenticated as @alice', color: '#10B981' },
    ],
  },
  {
    cmd: 'skillvault search "database migration"',
    output: [
      { text: 'Found 3 skills matching "database migration"', color: '#94A3B8' },
      { text: '  acme/db-migrate      v2.1.0  ↓ 1.2k', color: '#94A3B8' },
      { text: '  infra/pg-runner      v1.0.3  ↓ 847', color: '#94A3B8' },
    ],
  },
  {
    cmd: 'skillvault install acme/db-migrate',
    output: [
      { text: '✓ Installed acme/db-migrate@2.1.0', color: '#10B981' },
    ],
  },
];

type TerminalLine = { prompt?: boolean; text: string; color: string };

const TerminalAnimation: React.FC = () => {
  const [lines, setLines] = React.useState<TerminalLine[]>([]);
  const [typing, setTyping] = React.useState('');

  const s = React.useRef({
    lines: [] as TerminalLine[],
    cmdIdx: 0,
    charIdx: 0,
    outIdx: 0,
    phase: 'typing' as 'typing' | 'pause' | 'output' | 'wait-next' | 'wait-restart',
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  React.useEffect(() => {
    const r = s.current;

    const schedule = (fn: () => void, delay: number) => {
      r.timer = setTimeout(fn, delay);
    };

    const tick = () => {
      const script = TERMINAL_SCRIPT[r.cmdIdx];

      if (r.phase === 'typing') {
        r.charIdx++;
        setTyping(script.cmd.slice(0, r.charIdx));
        if (r.charIdx >= script.cmd.length) {
          r.phase = 'pause';
          schedule(tick, 700);
        } else {
          // slight random variance for natural feel
          schedule(tick, 36 + Math.random() * 30);
        }
      } else if (r.phase === 'pause') {
        r.lines = [...r.lines, { prompt: true, text: script.cmd, color: '#CBD5E1' }];
        setLines([...r.lines]);
        setTyping('');
        r.outIdx = 0;
        r.phase = 'output';
        schedule(tick, 220);
      } else if (r.phase === 'output') {
        if (r.outIdx < script.output.length) {
          const out = script.output[r.outIdx];
          r.lines = [...r.lines, { text: out.text, color: out.color }];
          setLines([...r.lines]);
          r.outIdx++;
          schedule(tick, 170);
        } else {
          r.cmdIdx++;
          if (r.cmdIdx < TERMINAL_SCRIPT.length) {
            r.phase = 'wait-next';
            schedule(tick, 520);
          } else {
            r.phase = 'wait-restart';
            schedule(tick, 3200);
          }
        }
      } else if (r.phase === 'wait-next') {
        r.charIdx = 0;
        r.phase = 'typing';
        schedule(tick, 0);
      } else if (r.phase === 'wait-restart') {
        r.cmdIdx = 0;
        r.charIdx = 0;
        r.phase = 'typing';
        r.lines = [];
        setLines([]);
        setTyping('');
        schedule(tick, 400);
      }
    };

    schedule(tick, 700);
    return () => { if (r.timer !== undefined) clearTimeout(r.timer); };
  }, []);

  return (
    <div style={{
      padding: '20px 24px',
      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
      fontSize: 13,
      lineHeight: 1.75,
      minHeight: 210,
    }}>
      {lines.map((line, i) => (
        <div key={i}>
          {line.prompt && <span style={{ color: '#10B981', userSelect: 'none' }}>$ </span>}
          <span style={{ color: line.color }}>{line.text}</span>
        </div>
      ))}
      {/* Active input line with blinking cursor */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#10B981', userSelect: 'none' }}>$ </span>
        <span style={{ color: '#CBD5E1' }}>{typing}</span>
        <span style={{
          display: 'inline-block',
          width: 2,
          height: 14,
          background: '#94A3B8',
          marginLeft: 1,
          animation: 'termBlink 1.1s step-end infinite',
        }} />
      </div>
    </div>
  );
};

// ── Hero ───────────────────────────────────────────────────────────────────
const Hero: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: `linear-gradient(160deg, #EEF2FF 0%, ${C.bg} 40%, #ECFDF5 100%)`,
      paddingTop: 140, paddingBottom: 96,
    }}>
      <Section>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: C.primaryLight, border: `1px solid ${C.primaryBorder}`,
              color: C.primary, fontSize: 13, fontWeight: 500,
              padding: '4px 14px', borderRadius: 20,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: C.primary, display: 'inline-block',
              }} />
              Private Skill Registry for AI Coding Agents
            </span>
          </div>

          {/* Headline */}
          <Title level={1} style={{
            fontSize: 'clamp(36px, 6vw, 58px)',
            fontWeight: 800, lineHeight: 1.12,
            letterSpacing: '-0.03em', color: C.text,
            margin: '0 0 20px',
          }}>
            Manage and distribute<br />
            <span style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.lavender})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              reusable AI skills
            </span>
          </Title>

          {/* Subtitle */}
          <Paragraph style={{
            fontSize: 18, color: C.textSecondary, lineHeight: 1.65,
            margin: '0 auto 40px', maxWidth: 560,
          }}>
            SkillVault is a self-hostable registry that lets teams upload, review,
            version, and install skills across Claude Code, OpenClaw, and other AI agents.
          </Paragraph>

          {/* CTAs */}
          <Space size={12} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/register')}
              style={{ height: 46, padding: '0 28px', borderRadius: 10, fontWeight: 600, fontSize: 15 }}
            >
              Get started free
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/app')}
              style={{
                height: 46, padding: '0 24px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                border: `1px solid ${C.border}`, color: C.textSecondary,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              View catalog <IconArrowRight />
            </Button>
          </Space>

          {/* Trust note */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <IconCheck color={C.mint} />
            <Text style={{ color: C.textMuted, fontSize: 13 }}>Self-hostable</Text>
            <span style={{ color: C.border, margin: '0 4px' }}>·</span>
            <IconCheck color={C.mint} />
            <Text style={{ color: C.textMuted, fontSize: 13 }}>No vendor lock-in</Text>
            <span style={{ color: C.border, margin: '0 4px' }}>·</span>
            <IconCheck color={C.mint} />
            <Text style={{ color: C.textMuted, fontSize: 13 }}>Open API</Text>
          </div>
        </div>

        {/* Terminal card */}
        <div style={{ marginTop: 64, maxWidth: 680, margin: '64px auto 0' }}>
          <div style={{
            background: '#0F172A', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
            overflow: 'hidden',
          }}>
            {/* Window bar */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#EF4444', '#F59E0B', '#10B981'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{
                fontSize: 12, color: '#64748B',
                flex: 1, textAlign: 'center', fontFamily: 'monospace',
              }}>
                terminal
              </span>
            </div>
            {/* Animated terminal content */}
            <TerminalAnimation />
          </div>
        </div>
      </Section>
      <style>{`
        @keyframes termBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
};

// ── Features ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: <IconCloud />,
    title: 'Centralized Registry',
    desc: 'One place to publish, version, and distribute skills across all your AI agents and teams.',
  },
  {
    icon: <IconShield />,
    title: 'Built-in Security Scan',
    desc: 'Every uploaded artifact is automatically scanned before approval. Catch issues before they reach production.',
  },
  {
    icon: <IconLayers />,
    title: 'Version Control',
    desc: 'Full semantic versioning with a structured review workflow: draft → review → approved → published.',
  },
  {
    icon: <IconSearch />,
    title: 'Instant Discovery',
    desc: 'Full-text search across skill names, descriptions, tags, and runtimes. Find the right skill in seconds.',
  },
];

const Features: React.FC = () => (
  <div id="features" style={{ background: C.surface, paddingTop: 96, paddingBottom: 96 }}>
    <Section>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{
          display: 'inline-block',
          background: C.mintLight, border: `1px solid ${C.mintBorder}`,
          color: C.mint, fontSize: 12, fontWeight: 600,
          padding: '3px 12px', borderRadius: 20, marginBottom: 16,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Features
        </span>
        <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.025em', color: C.text, margin: '0 0 12px' }}>
          Everything your team needs
        </Title>
        <Text style={{ color: C.textSecondary, fontSize: 16, maxWidth: 480, display: 'block', margin: '0 auto' }}>
          From upload to installation — SkillVault handles the full lifecycle of your AI skills.
        </Text>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '28px 24px',
              transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = '0 8px 24px rgba(99,102,241,0.08)';
              el.style.transform = 'translateY(-2px)';
              el.style.borderColor = C.primaryBorder;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = 'none';
              el.style.transform = 'none';
              el.style.borderColor = C.border;
            }}
          >
            <div style={{ marginBottom: 16 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8, letterSpacing: '-0.01em' }}>
              {f.title}
            </div>
            <div style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.65 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// ── How it works ───────────────────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: 'Upload your skill',
    desc: 'Package your skill as a .tar.gz or .zip archive and upload it via the web UI or CLI. Add metadata, tags, and target runtimes.',
    tag: 'skillvault publish acme/my-skill --version 1.0.0',
  },
  {
    num: '02',
    title: 'Review & approve',
    desc: 'Artifacts go through a structured workflow: draft → pending review → approved → published. Reviewers can approve or reject with comments.',
    tag: 'Review Center',
  },
  {
    num: '03',
    title: 'Install anywhere',
    desc: 'Install approved skills in any AI agent environment with a single command. Claude Code and OpenClaw adapters are built-in.',
    tag: 'skillvault install acme/my-skill',
  },
];

const HowItWorks: React.FC = () => (
  <div id="how-it-works" style={{ background: C.bg, paddingTop: 96, paddingBottom: 96 }}>
    <Section>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{
          display: 'inline-block',
          background: C.primaryLight, border: `1px solid ${C.primaryBorder}`,
          color: C.primary, fontSize: 12, fontWeight: 600,
          padding: '3px 12px', borderRadius: 20, marginBottom: 16,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          How it works
        </span>
        <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.025em', color: C.text, margin: '0 0 12px' }}>
          From local to production in 3 steps
        </Title>
        <Text style={{ color: C.textSecondary, fontSize: 16 }}>
          A simple, auditable workflow designed for engineering teams.
        </Text>
      </div>

      {/* Steps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ position: 'relative' }}>
            {/* Connector line (not last) */}
            {i < steps.length - 1 && (
              <div style={{
                display: 'none', // hidden on mobile grid, visible on wide layout via container query workaround
              }} />
            )}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '28px 24px',
              height: '100%',
            }}>
              {/* Step number */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: C.primaryLight, border: `1px solid ${C.primaryBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: C.primary,
                marginBottom: 20, fontFamily: 'monospace', letterSpacing: '-0.02em',
              }}>
                {s.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 10, letterSpacing: '-0.01em' }}>
                {s.title}
              </div>
              <div style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
                {s.desc}
              </div>
              {/* Code/label tag */}
              <div style={{
                background: '#0F172A', borderRadius: 8,
                padding: '8px 12px',
                fontFamily: 'monospace', fontSize: 12, color: '#94A3B8',
                border: '1px solid rgba(255,255,255,0.06)',
                wordBreak: 'break-all',
              }}>
                <span style={{ color: C.mint, userSelect: 'none' }}>$ </span>
                {s.tag}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// ── Integrations strip ─────────────────────────────────────────────────────
const Integrations: React.FC = () => (
  <div style={{
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    padding: '40px 0',
  }}>
    <Section>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Text style={{ color: C.textMuted, fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Works with your agent runtime
        </Text>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 12, flexWrap: 'wrap',
      }}>
        {[
          { name: 'Claude Code', color: C.primary, bg: C.primaryLight, border: C.primaryBorder },
          { name: 'OpenClaw', color: '#059669', bg: C.mintLight, border: C.mintBorder },
          { name: 'REST API', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
          { name: 'CLI', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
          { name: 'Docker', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
        ].map(item => (
          <div
            key={item.name}
            style={{
              background: item.bg, border: `1px solid ${item.border}`,
              color: item.color, borderRadius: 20,
              padding: '6px 16px', fontSize: 13, fontWeight: 500,
            }}
          >
            {item.name}
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// ── Permissions / RBAC callout ─────────────────────────────────────────────
const RBACSection: React.FC = () => (
  <div style={{ background: C.bg, paddingTop: 96, paddingBottom: 96 }}>
    <Section>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 48, alignItems: 'center',
      }}>
        {/* Text side */}
        <div>
          <span style={{
            display: 'inline-block',
            background: '#F5F3FF', border: '1px solid #DDD6FE',
            color: '#7C3AED', fontSize: 12, fontWeight: 600,
            padding: '3px 12px', borderRadius: 20, marginBottom: 20,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Team Access Control
          </span>
          <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.025em', color: C.text, margin: '0 0 16px' }}>
            Role-based access<br />for every team size
          </Title>
          <Paragraph style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Organize skills by organization. Grant fine-grained roles so the right people
            can publish, review, or just install — nothing more.
          </Paragraph>
          {[
            'Owner — full org control and billing',
            'Admin — manage members and approve skills',
            'Developer — upload and submit for review',
            'Viewer — search, browse, and install',
          ].map(line => (
            <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <IconCheck color={C.mint} />
              <Text style={{ color: C.textSecondary, fontSize: 14 }}>{line}</Text>
            </div>
          ))}
        </div>

        {/* Visual side — role pill stack */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 28,
          boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
        }}>
          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Organization — acme
          </div>
          {[
            { name: 'alice', email: 'alice@acme.com', role: 'Owner', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
            { name: 'bob', email: 'bob@acme.com', role: 'Admin', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
            { name: 'carol', email: 'carol@acme.com', role: 'Developer', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'dave', email: 'dave@acme.com', role: 'Viewer', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
          ].map((m, i) => (
            <div key={m.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: i > 0 ? `1px solid ${C.divider}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.lavender})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{m.email}</div>
                </div>
              </div>
              <span style={{
                background: m.bg, color: m.color, border: `1px solid ${m.border}`,
                borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 500,
              }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  </div>
);

// ── CTA ────────────────────────────────────────────────────────────────────
const CTA: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.primaryLight} 0%, #F5F3FF 50%, ${C.mintLight} 100%)`,
      borderTop: `1px solid ${C.border}`,
      paddingTop: 96, paddingBottom: 96,
    }}>
      <Section>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.025em', color: C.text, margin: '0 0 16px' }}>
            Start building your<br />skill registry today
          </Title>
          <Paragraph style={{ color: C.textSecondary, fontSize: 16, lineHeight: 1.65, margin: '0 0 36px' }}>
            Self-host in minutes with Docker Compose. Your skills, your infrastructure, your rules.
          </Paragraph>
          <Space size={12} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/register')}
              style={{ height: 46, padding: '0 28px', borderRadius: 10, fontWeight: 600, fontSize: 15 }}
            >
              Create free account
            </Button>

            <Button
              size="large"
              style={{
                height: 46, padding: '0 24px', borderRadius: 10, fontWeight: 500, fontSize: 15,
                border: `1px solid ${C.border}`, color: C.textSecondary, background: C.surface,
              }}
            >
              Read the docs
            </Button>
          </Space>
          {/* Quick deploy snippet */}
          <div style={{
            marginTop: 40, background: '#0F172A', borderRadius: 10,
            padding: '14px 20px', display: 'inline-block', textAlign: 'left',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#94A3B8' }}>
              <span style={{ color: C.mint, userSelect: 'none' }}>$ </span>
              docker compose up -d
              <span style={{ color: C.mint }}> # ready in ~30 seconds</span>
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
};

// ── Footer ─────────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <footer style={{
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    padding: '36px 0',
  }}>
    <Section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <LogoMark size={22} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: '-0.02em' }}>
            SkillVault
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', gap: 24 }}>
          {['Docs', 'GitHub', 'Changelog', 'Status'].map(link => (
            <a key={link} href="#" style={{ color: C.textMuted, fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
              {link}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <Text style={{ color: C.textMuted, fontSize: 13 }}>
          © {new Date().getFullYear()} SkillVault
        </Text>
      </div>
    </Section>
  </footer>
);

// ── Page ───────────────────────────────────────────────────────────────────
const Landing: React.FC = () => (
  <div style={{ background: C.bg, fontFamily: 'Inter, -apple-system, sans-serif' }}>
    <Navbar />
    <main>
      <Hero />
      <Integrations />
      <Features />
      <HowItWorks />
      <RBACSection />
      <CTA />
    </main>
    <Footer />
  </div>
);

export default Landing;
