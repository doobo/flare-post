import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, '..', 'local-node.db');

const db = new Database(dbPath);

const offers = [
  {
    title: 'DigitalOcean $200 Credit for 60 Days',
    category: '虚拟机 / VPS',
    tags: 'digitalocean,vps,credit',
    discount: '50% OFF',
    end_date: '2026-08-15',
    promo_code: 'DO200CREDIT',
    body: `Sign up for DigitalOcean and get **$200 in credit** valid for 60 days. Perfect for testing out their droplet VPS instances, managed databases, and Kubernetes clusters.

Features included:
- **1-click** app deployments
- Generous free tier options
- 99.99% uptime SLA

Take advantage of this limited time offer to scale your infrastructure.`
  },
  {
    title: 'NordVPN 74% Off 2-Year Plan',
    category: 'VPN',
    tags: 'nordvpn,vpn,security',
    discount: '74% OFF',
    end_date: '2026-09-01',
    promo_code: 'NORD74DEAL',
    body: `Protect your online privacy with NordVPN. Get **74% off** the 2-year plan plus 3 extra months free.

Key features:
- 6000+ servers in 60+ countries
- Strict no-logs policy
- Threat protection included
- 30-day money-back guarantee

Connect up to 10 devices simultaneously.`
  },
  {
    title: 'AWS Free Tier — 12 Months of Free Services',
    category: '虚拟机 / VPS',
    tags: 'aws,cloud,free',
    discount: 'Free Tier',
    body: `Amazon Web Services offers a **generous free tier** for new customers, valid for 12 months from sign-up.

Includes:
- 750 hours of EC2 Linux t2.micro per month
- 5GB of S3 standard storage
- 750 hours of RDS db.t2.micro
- 25GB of DynamoDB storage

No upfront payment required — only pay if you exceed the free limits.`
  },
  {
    title: 'Namecheap .COM Domains for $8.98/yr',
    category: '域名',
    tags: 'namecheap,domains,deal',
    discount: '55% OFF',
    end_date: '2026-07-30',
    promo_code: 'COM898',
    body: `Register or transfer **.COM domains** at Namecheap for just **$8.98 per year**.

Benefits:
- Free WhoisGuard privacy protection
- Easy DNS management
- Free email forwarding
- 24/7 customer support

Best price for new domain registrations.`
  },
  {
    title: 'Mullvad VPN €5/Month Flat Rate',
    category: 'VPN',
    tags: 'mullvad,vpn,privacy',
    discount: 'Flat €5',
    body: `Mullvad VPN offers a **simple flat rate** of €5 per month — no promotions, no hidden fees, no price hikes.

Why Mullvad:
- No email or personal info required (anonymous account by random number)
- WireGuard & OpenVPN support
- 700+ servers in 40+ countries
- Built-in ad/tracker blocker
- RAM-only servers for maximum privacy

Pay with cash, crypto, or credit card.`
  },
  {
    title: 'Linode $100 Free Credit for New Accounts',
    category: '虚拟机 / VPS',
    tags: 'linode,vps,credit',
    discount: '$100 Credit',
    end_date: '2026-10-01',
    promo_code: 'LINODE100',
    body: `New Linode customers get **$100 in free credit** to try out their cloud infrastructure.

What you get:
- Choice of 11 data center locations worldwide
- Hourly billing (pay only for what you use)
- Simple, intuitive cloud manager
- 24/7/365 customer support
- Powerful API and CLI tools

Deploy your first server in under 60 seconds.`
  },
  {
    title: 'Cloudflare R2 — Zero Egress Fees',
    category: '服务器',
    tags: 'cloudflare,storage,object',
    discount: 'Zero Egress',
    body: `Cloudflare R2 object storage charges **zero egress fees**, making it the most cost-effective S3-compatible storage on the market.

Pricing:
- Storage: $0.015/GB/month
- Class A operations: $4.50/million
- Class B operations: $0.36/million

S3 API compatible — migrate from AWS S3 with zero code changes.`
  },
  {
    title: 'Hostinger Web Hosting — $2.69/mo',
    category: '服务器',
    tags: 'hostinger,hosting,deal',
    discount: '80% OFF',
    end_date: '2026-08-20',
    promo_code: 'HOSTINGER80',
    body: `Hostinger offers **blazing fast web hosting** starting at just **$2.69/month**.

What's included:
- 100GB SSD storage
- 100GB bandwidth
- Free SSL certificate
- Free domain name
- 1-click WordPress installer
- 24/7/365 support

48-month plan required for best pricing. 30-day money-back guarantee.`
  },
  {
    title: 'Vultr $250 Free Credit Promo',
    category: '虚拟机 / VPS',
    tags: 'vultr,vps,credit',
    discount: '$250 Credit',
    end_date: '2026-11-15',
    promo_code: 'VULTR250',
    body: `Deploy high-performance cloud servers with Vultr and receive **$250 in free credits**.

Highlights:
- 17 global data center locations
- NVMe SSD storage on all plans
- Deploy in 60 seconds or less
- Hourly and monthly billing options
- Bare metal, cloud compute, and GPU instances

Ideal for developers, startups, and growing businesses.`
  },
  {
    title: 'FastMail — $3/mo Professional Email',
    category: '域名',
    tags: 'fastmail,email,productivity',
    discount: '$3/mo',
    body: `Get **professional email hosting** with FastMail starting at just $3 per month.

Features:
- Custom domain email support
- 30GB storage on Standard plan
- Calendars, contacts, and file storage
- Fast search across all folders
- No ads, no tracking

Try free for 30 days — no credit card required.`
  }
];

const insert = db.prepare(`
  INSERT INTO posts (title, content_md, content_type, category_id, category, tags, status, created_at)
  VALUES (?, ?, 'markdown', 0, ?, ?, 'published', datetime('now', ?))
`);

const transaction = db.transaction(() => {
  for (let i = 0; i < offers.length; i++) {
    const o = offers[i];

    // Build frontmatter
    const frontmatter = [];
    if (o.discount) frontmatter.push(`discount_strength: ${o.discount}`);
    if (o.end_date) frontmatter.push(`end_date: ${o.end_date}`);
    if (o.promo_code) {
      frontmatter.push(`promo_code: ${o.promo_code}`);
      frontmatter.push(`show_promo_code: true`);
    }

    let contentMd = o.body.trim();
    if (frontmatter.length > 0) {
      contentMd = `---\n${frontmatter.join('\n')}\n---\n${contentMd}`;
    }

    // Stagger created_at so they're in a nice order
    const offset = `-${offers.length - i} hours`;

    insert.run(o.title, contentMd, o.category, o.tags, offset);
    console.log(`  ✓ ${o.title}`);
  }
});

console.log('Seeding 10 test offers...');
transaction();
console.log('Done!');
db.close();
