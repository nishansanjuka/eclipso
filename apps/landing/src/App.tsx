import {
  BarChart3Icon,
  BoxesIcon,
  CheckIcon,
  ClockIcon,
  CloudOffIcon,
  KeyboardIcon,
  LockIcon,
  PercentIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StoreIcon,
  TruckIcon,
  UsersIcon,
  WifiIcon,
  type LucideIcon,
} from "lucide-react";

const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? "";
const signUp = `${APP_URL}/sign-up`;
const signIn = `${APP_URL}/sign-in`;

function Mark() {
  return (
    <span className="mark">
      <StoreIcon size={17} strokeWidth={2} aria-hidden />
    </span>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="wrap">
        <a className="brand" href="#top">
          <Mark />
          Aperture
        </a>
        <nav className="nav" aria-label="Main">
          <a href="#till">At the till</a>
          <a href="#stock">Stock</a>
          <a href="#insights">AI insights</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Questions</a>
        </nav>
        <div className="actions">
          <a className="btn btn-ghost" href={signIn}>
            Sign in
          </a>
          <a className="btn btn-primary" href={signUp}>
            Start free for 14 days
          </a>
        </div>
      </div>
    </header>
  );
}

function TillMock() {
  const lines: [string, string, string][] = [
    ["Cotton shirt, M", "2 × 1,650.00", "3,300.00"],
    ["Linen shirt, L", "1 × 4,950.00", "4,950.00"],
    ["Ceramic mug", "3 × 690.00", "2,070.00"],
    ["Carrier bags", "1 × 9.50", "9.50"],
  ];
  return (
    <div className="till" aria-label="The Aperture sale screen">
      <div className="till-tabs">
        <span className="till-tab on">Sale 1</span>
        <span className="till-tab">Sale 2</span>
        <span className="till-status">
          <WifiIcon size={14} aria-hidden /> Online
        </span>
      </div>
      <div className="till-body">
        <div className="till-lines">
          {lines.map(([name, qty, total]) => (
            <div className="till-line num" key={name}>
              <span>
                {name}
                <small>{qty}</small>
              </span>
              <span>{total}</span>
            </div>
          ))}
        </div>
        <div className="till-total">
          <span className="muted">Total</span>
          <span className="big num">Rs 12,742.35</span>
          <span className="muted num">Includes VAT 18%: 1,943.90</span>
          <span className="till-pay num">Pay Rs 12,742.35</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div className="stack">
          <span className="pill">
            <StoreIcon size={13} aria-hidden /> Built for shops in Sri Lanka
          </span>
          <h1>The till and the stock room, on the same numbers.</h1>
          <p className="lead">
            Aperture runs your counter, your stock and your reports as one
            system. Sell in seconds, see what is left on the shelf, and find out
            why a number moved without exporting anything.
          </p>
          <div className="row">
            <a className="btn btn-primary btn-lg" href={signUp}>
              Start free for 14 days
            </a>
            <a className="btn btn-secondary btn-lg" href="#pricing">
              See how pricing works
            </a>
          </div>
          <div className="checks">
            <span>
              <CheckIcon size={16} aria-hidden /> No card to start
            </span>
            <span>
              <CheckIcon size={16} aria-hidden /> Keeps selling offline
            </span>
            <span>
              <CheckIcon size={16} aria-hidden /> VAT, or no VAT, your choice
            </span>
          </div>
        </div>
        <TillMock />
      </div>
    </section>
  );
}

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: KeyboardIcon,
    title: "The queue keeps moving",
    text: "Four sales open at once, barcode first, and a keypad for weighed goods. Every action has a key, so nobody hunts for a button.",
  },
  {
    icon: CloudOffIcon,
    title: "It works when the line drops",
    text: "Sales are written on the register and sync when the connection is back. The banner tells the cashier exactly what still works.",
  },
  {
    icon: BoxesIcon,
    title: "Stock that matches the shelf",
    text: "Counts, transfers, purchase orders and receiving in one place, with variance shown before you commit.",
  },
  {
    icon: PercentIcon,
    title: "Tax set once",
    text: "VAT registered or not is a single switch. Rates sit per product and break out on the receipt.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Roles that make sense",
    text: "Owners see everything. Managers see their stores. Cashiers see the till and their own shift.",
  },
];

function Features() {
  return (
    <section className="block tinted">
      <div className="wrap">
        <div className="features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div className="card" key={title}>
              <span className="icon">
                <Icon size={20} aria-hidden />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Points({
  items,
}: {
  items: { icon: LucideIcon; title: string; text: string }[];
}) {
  return (
    <ul className="points">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title}>
          <span className="icon">
            <Icon size={16} aria-hidden />
          </span>
          <div>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Counter() {
  return (
    <section className="block" id="till">
      <div className="wrap split">
        <div className="stack">
          <span className="eyebrow">At the counter</span>
          <h2 className="title">
            Fast enough that nobody looks at the screen.
          </h2>
          <p className="lead">
            The sale screen is built for standing up: big targets, the scan
            field always ready, and the total the largest thing in the room.
            Four sales can be open at once, so a customer who forgot their
            wallet does not block the queue.
          </p>
          <Points
            items={[
              {
                icon: ScanLineIcon,
                title: "Scan first, everything else second",
                text: "Unknown barcodes, out of stock and weighed goods each have a clear path.",
              },
              {
                icon: ClockIcon,
                title: "Park and recall",
                text: "Hold a sale with its customer, discounts and payments intact.",
              },
              {
                icon: LockIcon,
                title: "A PIN at the till, not a password",
                text: "Nobody types a password at the counter.",
              },
            ]}
          />
          <a className="btn btn-primary btn-lg" href={signUp}>
            Start free for 14 days
          </a>
        </div>
        <TillMock />
      </div>
    </section>
  );
}

function Stock() {
  const rows: [string, string, string, "ok" | "warn" | "bad", string][] = [
    ["Cotton shirt, M", "212", "96", "ok", "In stock"],
    ["Linen shirt, L", "11", "6", "warn", "Low"],
    ["Ceramic mug", "64", "41", "ok", "In stock"],
    ["Steel bottle", "0", "31", "bad", "Out"],
  ];
  return (
    <section className="block tinted" id="stock">
      <div className="wrap split flip">
        <div className="panel" aria-label="Stock by store">
          {rows.map(([name, galle, kandy, tone, label]) => (
            <div className="panel-row num" key={name}>
              <span className="grow">{name}</span>
              <span>{galle}</span>
              <span>{kandy}</span>
              <span className={`badge ${tone}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="stack">
          <span className="eyebrow">Behind the shop</span>
          <h2 className="title">
            Know what is on the shelf, not what the system hopes is there.
          </h2>
          <p className="lead">
            Stock moves with every sale, refund, transfer and delivery, per
            store. Counting sessions show counted against expected, and you
            approve the variance before anything changes.
          </p>
          <Points
            items={[
              {
                icon: ShieldCheckIcon,
                title: "Counts you can trust",
                text: "Variance is reviewed, reasons are recorded, and nothing posts silently.",
              },
              {
                icon: TruckIcon,
                title: "Purchase orders and receiving",
                text: "Partial receipts, backorders and cost changes tracked against the PO.",
              },
              {
                icon: BarChart3Icon,
                title: "Every store, side by side",
                text: "See how each shop is growing without exporting a thing.",
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Insights() {
  return (
    <section className="block" id="insights">
      <div className="wrap split">
        <div className="stack">
          <span className="eyebrow">Ask, do not dig</span>
          <h2 className="title">
            Ask the question you would ask a good manager.
          </h2>
          <p className="lead">
            Aperture watches your own sales, stock and shifts, and tells you
            what changed and why. Every answer shows its working out and the
            data it used, and most of them come with one action you can take on
            the spot.
          </p>
          <Points
            items={[
              {
                icon: SparklesIcon,
                title: "Insights with evidence",
                text: "A finding, a small chart, a confidence level and one clear action.",
              },
              {
                icon: LockIcon,
                title: "Your data stays yours",
                text: "Answers are built from your stores only. Nothing is shared with other businesses.",
              },
            ]}
          />
        </div>
        <div className="panel">
          <div className="insight">
            <span className="q">Why did Kandy margin drop last week?</span>
            <p>
              Margin fell from 43.1% to 40.6%. Almost all of it is 38 Linen
              Shirts sold at 15% off under a weekend rule that should have ended
              on Thursday.
            </p>
            <span className="src">
              From 1,284 sales at Kandy and the discount rule log
            </span>
            <div className="acts">
              <span>End the rule</span>
              <span>Not now</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TIERS = [
  {
    name: "Single shop",
    text: "One store, one or two registers, and everything at the counter.",
    items: [
      "The full till, offline included",
      "Stock, counts and purchase orders",
      "Sales and shift reports",
      "Email support",
    ],
  },
  {
    name: "Multi store",
    featured: true,
    text: "Several shops, transfers between them, and the owner dashboard.",
    items: [
      "Everything in Single shop",
      "Transfers and stock by location",
      "Owner dashboard across stores",
      "AI insights and recommendations",
      "Priority support",
    ],
  },
  {
    name: "Chain",
    text: "Ten registers or more, or a warehouse feeding the shops.",
    items: [
      "Everything in Multi store",
      "Warehouse and supplier workflows",
      "Accounting and payroll exports",
      "A named contact",
    ],
  },
];

function Pricing() {
  return (
    <section className="block tinted" id="pricing">
      <div className="wrap stack" style={{ gap: 28 }}>
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">Pricing</span>
          <h2 className="title">Priced per register, not per person</h2>
          <p className="lead">
            Invite as many managers and cashiers as you need. You pay for the
            tills that are actually running.
          </p>
        </div>
        <div className="tiers" style={{ width: "100%" }}>
          {TIERS.map((tier) => (
            <div
              className={`tier${tier.featured ? " featured" : ""}`}
              key={tier.name}
            >
              <h3>
                {tier.name}
                {tier.featured && (
                  <span className="pill">Most shops start here</span>
                )}
              </h3>
              <p className="lead" style={{ fontSize: 15, lineHeight: "22px" }}>
                {tier.text}
              </p>
              <ul>
                {tier.items.map((item) => (
                  <li key={item}>
                    <CheckIcon size={16} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className={`btn btn-lg ${tier.featured ? "btn-primary" : "btn-secondary"}`}
                href={signUp}
              >
                Start free for 14 days
              </a>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)" }}>
          Free setup help and CSV import for your first 1,000 products.
        </p>
      </div>
    </section>
  );
}

const FAQ = [
  [
    "Does it work if the internet drops?",
    "Yes. Sales are written on the register and sync when the line comes back. The cashier sees a banner that says what still works, and the queue of unsynced sales.",
  ],
  [
    "We are not VAT registered. Is that a problem?",
    "No. It is one switch during setup. With it off, no tax line appears anywhere, on screen or on the receipt.",
  ],
  [
    "Can we bring our products from our old system?",
    "A CSV is enough. Columns are matched for you, you correct anything we guessed, and nothing is saved until you press Import.",
  ],
  [
    "What hardware do we need?",
    "A tablet or a laptop, a barcode scanner, a receipt printer and a card terminal. Aperture works with the terminal you already have in most cases.",
  ],
  [
    "How do my staff get access?",
    "You invite them by email from the back office. Each person gets a link that works once, creates their own account, and only reaches what their role allows.",
  ],
];

function Faq() {
  return (
    <section className="block" id="faq">
      <div className="wrap stack" style={{ gap: 24 }}>
        <h2 className="title">Questions shop owners ask first</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="block tinted cta">
      <div className="wrap">
        <div className="stack">
          <h2 className="title">Try it on a real Saturday.</h2>
          <p className="lead" style={{ maxWidth: 620 }}>
            Set up in an afternoon, run one register through a busy day, and
            keep the data if you stay. Fourteen days, no card, no lock in.
          </p>
          <div className="row">
            <a className="btn btn-primary btn-lg" href={signUp}>
              Start free for 14 days
            </a>
            <a className="btn btn-secondary btn-lg" href={signIn}>
              Sign in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a className="brand" href="#top">
            <Mark />
            Aperture
          </a>
          <p>
            Point of sale and stock for small and mid size retail. Made for
            shops that count their own stock.
          </p>
        </div>
        <nav aria-label="Product">
          <strong>Product</strong>
          <a href="#till">At the till</a>
          <a href="#stock">Stock</a>
          <a href="#insights">AI insights</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <nav aria-label="Account">
          <strong>Account</strong>
          <a href={signUp}>Start free</a>
          <a href={signIn}>Sign in</a>
          <a href="#faq">Questions</a>
        </nav>
        <span className="legal">
          <UsersIcon size={12} aria-hidden style={{ verticalAlign: -1 }} /> Rs ·
          Sri Lanka
        </span>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Counter />
        <Stock />
        <Insights />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
