import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  Clock,
  FileText,
  Filter as FilterIcon,
  Home,
  LogOut,
  Menu,
  MessageSquareWarning,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Printer,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import "./App.css";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: object;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
        execute: (input: unknown) => unknown;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

type Status =
  | "مسودة"
  | "جديد"
  | "بانتظار الاستلام"
  | "تم الاستلام"
  | "قيد المتابعة"
  | "قيد المعالجة"
  | "بانتظار معلومات"
  | "موعد محدد"
  | "قيد التنفيذ"
  | "مؤجل"
  | "مشكلة"
  | "مكتمل"
  | "مغلق"
  | "ملغي";
type Priority = "عادي" | "مهم" | "عاجل";
type RequestType = "طلب بيع" | "مشروع / زيارة موقع" | "استفسار" | "صيانة" | "شكوى" | "متابعة" | "طلب داخلي" | "أخرى";

type Employee = { id: string; role: string };
type Customer = { id: string; name: string; phone: string; altPhone?: string; company?: string; city: string; address?: string; email?: string; notes?: string; createdAt: string };
type TimelineEvent = { id: string; requestId: string; at: string; actor: string; action: string };
type RequestItem = {
  id: string;
  number: number;
  customerId: string;
  type: RequestType;
  description: string;
  status: Status;
  priority: Priority;
  urgentReason?: string;
  assigneeId: string;
  createdBy: string;
  createdAt: string;
  transferredAt?: string;
  acceptedAt?: string;
  followUpAt?: string;
  internalNotes?: string;
};
type ContactLog = { id: string; customerId: string; requestId?: string; at: string; direction: "وارد" | "صادر"; result: string; notes: string; user: string };
type Complaint = { id: string; customerId: string; requestId?: string; type: string; description: string; priority: Priority; status: string; assigneeId: string };
type MaintenanceRequest = { id: string; customerId: string; product: string; issue: string; priority: Priority; status: string; assigneeId: string };
type AppNotification = { id: string; title: string; description: string; at: string; requestId?: string; read: boolean };
type RequestFilters = { query: string; status: string; type: string; assigneeId: string; dateFrom: string; dateTo: string };
type ReportFilters = RequestFilters & { customerId: string };

const logoSrc = `${import.meta.env.BASE_URL}alnaseem-logo.png`;

const employees: Employee[] = [
  { id: "sales", role: "قسم المبيعات" },
  { id: "projects", role: "قسم المشاريع" },
  { id: "relations", role: "قسم علاقات الزبائن" },
  { id: "production", role: "قسم الإنتاج" },
  { id: "installation", role: "قسم التركيب" },
  { id: "factory", role: "قسم المصنع" },
  { id: "technical", role: "قسم التنسيق الفني" },
  { id: "hr", role: "قسم شؤون الموظفين" },
];

const routeSuggestion: Record<RequestType, string> = {
  "طلب بيع": "sales",
  "مشروع / زيارة موقع": "projects",
  استفسار: "relations",
  صيانة: "installation",
  شكوى: "relations",
  متابعة: "relations",
  "طلب داخلي": "hr",
  أخرى: "relations",
};

const cities = ["الخليل", "رام الله", "بيت لحم", "نابلس", "القدس", "جنين", "طولكرم", "أريحا"];
const names = [
  ["أحمد محمد", "0599123456", "الخليل", ""],
  ["شركة النور", "0598456789", "رام الله", "شركة النور"],
  ["محمد علي", "0567788990", "بيت لحم", ""],
  ["رامي خالد", "0599554433", "الخليل", ""],
  ["شركة الأفق للمقاولات", "0599332211", "رام الله", "شركة الأفق للمقاولات"],
  ["سامي محمود", "0568112233", "نابلس", ""],
];

function iso(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

function seedData() {
  const customers: Customer[] = Array.from({ length: 25 }, (_, i) => {
    const base = names[i] ?? [`عميل تجريبي ${i + 1}`, `059${(7000000 + i * 7319).toString().slice(0, 7)}`, cities[i % cities.length], i % 4 === 0 ? `شركة تجريبية ${i + 1}` : ""];
    return {
      id: `c${i + 1}`,
      name: base[0],
      phone: base[1],
      altPhone: i % 3 === 0 ? `02${(2300000 + i * 417).toString()}` : "",
      company: base[3],
      city: base[2],
      address: i % 2 === 0 ? `شارع ${i + 3}` : "",
      email: `client${i + 1}@example.com`,
      notes: i === 0 ? "عميل مهم بمشاريع أبواب وألمنيوم، يحتاج متابعة دورية." : "",
      createdAt: iso(30000 + i * 800),
    };
  });
  const requestTypes: RequestType[] = ["مشروع / زيارة موقع", "استفسار", "صيانة", "طلب بيع", "شكوى", "متابعة", "طلب داخلي", "أخرى"];
  const statuses: Status[] = ["موعد محدد", "بانتظار الاستلام", "تم الاستلام", "قيد التنفيذ", "بانتظار معلومات", "مسودة", "مغلق", "ملغي", "قيد المتابعة", "مشكلة"];
  const requests: RequestItem[] = Array.from({ length: 40 }, (_, i) => {
    const type = requestTypes[i % requestTypes.length];
    const status = i === 0 ? "موعد محدد" : i === 5 ? "بانتظار الاستلام" : statuses[i % statuses.length];
    const createdAt = iso(20 + i * 37);
    return {
      id: `r${i + 1}`,
      number: 125 + i,
      customerId: customers[i % customers.length].id,
      type,
      description: i === 0 ? "العميل يرغب بزيارة الموقع لمعاينة المشروع وتحديد المقاسات." : `وصف تجريبي للطلب ${125 + i}`,
      status,
      priority: i % 11 === 0 ? "عاجل" : i % 4 === 0 ? "مهم" : "عادي",
      urgentReason: i % 11 === 0 ? "العميل يحتاج ردًا سريعًا قبل نهاية اليوم." : "",
      assigneeId: routeSuggestion[type],
      createdBy: "قسم السنترال",
      createdAt,
      transferredAt: status === "مسودة" ? "" : iso(15 + i * 37),
      acceptedAt: ["تم الاستلام", "قيد التنفيذ", "موعد محدد", "مكتمل"].includes(status) ? iso(5 + i * 37) : "",
      followUpAt: i % 3 === 0 ? iso(-1440 + i * 20) : i % 5 === 0 ? iso(90) : "",
      internalNotes: i === 4 ? "طلب مرتجع: موقع العميل غير واضح." : "",
    };
  });
  const timelines: TimelineEvent[] = requests.flatMap((request, i) => [
    { id: `t${i}-1`, requestId: request.id, at: request.createdAt, actor: "قسم السنترال", action: "تم تسجيل الطلب" },
    ...(request.transferredAt ? [{ id: `t${i}-2`, requestId: request.id, at: request.transferredAt, actor: "قسم السنترال", action: `تم تحويل الطلب إلى ${employeeName(request.assigneeId)}` }] : []),
    ...(request.acceptedAt ? [{ id: `t${i}-3`, requestId: request.id, at: request.acceptedAt, actor: employeeName(request.assigneeId), action: "تم استلام الطلب وتحديث الحالة" }] : []),
  ]);
  const contacts: ContactLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: `cl${i + 1}`,
    customerId: customers[i % customers.length].id,
    requestId: requests[i % requests.length].id,
    at: iso(i * 45),
    direction: i % 2 === 0 ? "وارد" : "صادر",
    result: ["تم الرد", "لم يرد", "تم التأكيد", "طلب معلومات إضافية"][i % 4],
    notes: "توثيق اتصال تجريبي ضمن سجل العميل والطلب.",
    user: "قسم السنترال",
  }));
  const complaints: Complaint[] = Array.from({ length: 5 }, (_, i) => ({
    id: `cmp${i + 1}`,
    customerId: customers[(i + 2) % customers.length].id,
    requestId: requests[(i + 4) % requests.length].id,
    type: ["تأخير", "تركيب", "منتج", "خدمة", "تعامل موظف"][i],
    description: "شكوى تجريبية تحتاج متابعة واضحة.",
    priority: i === 0 ? "عاجل" : "عادي",
    status: i === 1 ? "تم الحل" : "قيد المعالجة",
    assigneeId: "relations",
  }));
  const maintenance: MaintenanceRequest[] = Array.from({ length: 5 }, (_, i) => ({
    id: `m${i + 1}`,
    customerId: customers[(i + 5) % customers.length].id,
    product: "باب ألمنيوم",
    issue: "مشكلة في الإغلاق تحتاج فحصًا.",
    priority: i === 2 ? "عاجل" : "عادية" as Priority,
    status: i === 3 ? "مكتملة" : "محولة",
    assigneeId: "installation",
  }));
  const notifications: AppNotification[] = Array.from({ length: 15 }, (_, i) => ({
    id: `n${i + 1}`,
    title: ["طلب لم يتم استلامه", "موعد بحاجة تأكيد", "متابعة متأخرة", "تم تحديث طلب", "شكوى بحاجة متابعة"][i % 5],
    description: `تنبيه تجريبي مرتبط بالطلب #${requests[i % requests.length].number}`,
    at: iso(i * 18),
    requestId: requests[i % requests.length].id,
    read: i % 3 === 0,
  }));
  return { customers, requests, contacts, timelines, complaints, maintenance, notifications };
}

function employeeName(id: string) {
  if (id === "install") return "قسم التركيب";
  const employee = employees.find((item) => item.id === id);
  return employee ? employee.role : "غير محدد";
}

function normalizeAssigneeId(id: string) {
  return id === "install" ? "installation" : id;
}

function displayDepartmentText(value: string) {
  const exactDepartments: Record<string, string> = {
    "سارة": "قسم السنترال",
    "كريم": "قسم المشاريع",
    "فهد": "قسم علاقات الزبائن",
    "وسام": "قسم التركيب",
    "نسيم": "قسم المبيعات",
  };
  if (exactDepartments[value.trim()]) return exactDepartments[value.trim()];
  return value
    .replaceAll("سارة — السنترال", "قسم السنترال")
    .replaceAll("سارة - السنترال", "قسم السنترال")
    .replaceAll("كريم — المشاريع", "قسم المشاريع")
    .replaceAll("كريم - المشاريع", "قسم المشاريع")
    .replaceAll("فهد — علاقات الزبائن", "قسم علاقات الزبائن")
    .replaceAll("فهد - علاقات الزبائن", "قسم علاقات الزبائن")
    .replaceAll("وسام — التركيب", "قسم التركيب")
    .replaceAll("وسام - التركيب", "قسم التركيب")
    .replaceAll("نسيم — المبيعات", "قسم المبيعات")
    .replaceAll("نسيم - المبيعات", "قسم المبيعات")
    .replaceAll("الإنتاج والتركيب", "التركيب");
}

function useStoredState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  });
  const save = (next: T) => {
    setState(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [state, save] as const;
}

function formatTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function statusClass(status: string) {
  if (["مكتمل", "تم الاستلام"].includes(status)) return "success";
  if (["بانتظار الاستلام", "بانتظار معلومات", "مؤجل"].includes(status)) return "warning";
  if (["مشكلة", "ملغي"].includes(status)) return "danger";
  if (["قيد المتابعة", "موعد محدد"].includes(status)) return "purple";
  return "neutral";
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function App() {
  const initial = useMemo(() => seedData(), []);
  const [loggedIn, setLoggedIn] = useStoredState("alnaseem-auth", false);
  const [customers, setCustomers] = useStoredState<Customer[]>("alnaseem-customers", initial.customers);
  const [requests, setRequests] = useStoredState<RequestItem[]>("alnaseem-requests", initial.requests);
  const [contacts, setContacts] = useStoredState<ContactLog[]>("alnaseem-contacts", initial.contacts);
  const [timelines, setTimelines] = useStoredState<TimelineEvent[]>("alnaseem-timeline", initial.timelines);
  const [complaints, setComplaints] = useStoredState<Complaint[]>("alnaseem-complaints", initial.complaints);
  const [maintenance, setMaintenance] = useStoredState<MaintenanceRequest[]>("alnaseem-maintenance", initial.maintenance);
  const [notifications, setNotifications] = useStoredState<AppNotification[]>("alnaseem-notifications", initial.notifications);
  const [toast, setToast] = useState("");
  const app = { customers, setCustomers, requests, setRequests, contacts, setContacts, timelines, setTimelines, complaints, setComplaints, maintenance, setMaintenance, notifications, setNotifications, setToast };

  const resetData = () => {
    const fresh = seedData();
    setCustomers(fresh.customers);
    setRequests(fresh.requests);
    setContacts(fresh.contacts);
    setTimelines(fresh.timelines);
    setComplaints(fresh.complaints);
    setMaintenance(fresh.maintenance);
    setNotifications(fresh.notifications);
    setToast("تمت إعادة بيانات التجربة");
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: "read_central_summary",
        title: "Read central summary",
        description: "إرجاع ملخص مختصر للأعداد الحالية في النظام.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({
          customers: customers.length,
          requests: requests.length,
          awaitingAcceptance: requests.filter((r) => r.status === "بانتظار الاستلام").length,
          unreadNotifications: notifications.filter((n) => !n.read).length,
        }),
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: "create_customer_record",
        title: "إنشاء سجل عميل",
        description: "إنشاء عميل في نفس التخزين المحلي المستخدم في واجهة إنشاء العميل.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            city: { type: "string" },
          },
          required: ["name", "phone"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          const payload = input as { name?: string; phone?: string; city?: string };
          if (!payload.name || !payload.phone) throw new Error("name and phone are required");
          if (customers.some((customer) => customer.phone === payload.phone)) throw new Error("duplicate phone");
          const customer: Customer = {
            id: `c${Date.now()}`,
            name: payload.name,
            phone: payload.phone,
            city: payload.city || "رام الله",
            createdAt: new Date().toISOString(),
          };
          setCustomers([customer, ...customers]);
          setToast("تم حفظ العميل بنجاح");
          return { id: customer.id, name: customer.name, phone: customer.phone };
        },
      }, { signal: lifecycle.signal });
    };
    register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [customers, notifications, requests, setCustomers]);

  return (
    <HashRouter>
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setLoggedIn(true)} />} />
        <Route
          path="/*"
          element={loggedIn ? <Shell onLogout={() => setLoggedIn(false)} unread={notifications.filter((n) => !n.read).length} app={app} resetData={resetData} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </HashRouter>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("central");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (username === "central" && password === "123456") onLogin();
    else setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
  };
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <Logo />
        <h1>نظام السنترال</h1>
        <p>دخول موظفة الاستقبال لتوثيق الاتصالات وتحويل الطلبات.</p>
        <label>اسم المستخدم<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>كلمة المرور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="remember"><input type="checkbox" /> تذكرني</label>
        {error && <div className="error">{error}</div>}
        <button className="primary">دخول</button>
        <button type="button" className="linkish">نسيت كلمة المرور؟</button>
      </form>
    </main>
  );
}

type AppState = ReturnType<typeof App> extends never ? never : {
  customers: Customer[]; setCustomers: (v: Customer[]) => void;
  requests: RequestItem[]; setRequests: (v: RequestItem[]) => void;
  contacts: ContactLog[]; setContacts: (v: ContactLog[]) => void;
  timelines: TimelineEvent[]; setTimelines: (v: TimelineEvent[]) => void;
  complaints: Complaint[]; setComplaints: (v: Complaint[]) => void;
  maintenance: MaintenanceRequest[]; setMaintenance: (v: MaintenanceRequest[]) => void;
  notifications: AppNotification[]; setNotifications: (v: AppNotification[]) => void;
  setToast: (v: string) => void;
};

function Shell({ onLogout, unread, app, resetData }: { onLogout: () => void; unread: number; app: AppState; resetData: () => void }) {
  const items = [
    ["/dashboard", "الرئيسية", Home],
    ["/requests/new", "تسجيل اتصال / طلب جديد", Plus],
    ["/requests", "الطلبات الواردة", ClipboardList],
    ["/transferred", "الطلبات المحولة", RefreshCw],
    ["/follow-ups", "المتابعة", Clock],
    ["/customers", "العملاء", Users],
    ["/complaints", "الشكاوى والصيانة", MessageSquareWarning],
    ["/notifications", "الإشعارات", Bell],
    ["/reports", "التقارير", FileText],
    ["/settings", "الإعدادات", Settings],
  ] as const;
  return (
    <div className="app-shell">
      <aside>
        <Link className="brand" to="/dashboard"><Logo compact /></Link>
        <nav>{items.map(([href, label, Icon]) => <Link key={href} to={href}><Icon size={18} />{label}{label === "الإشعارات" && unread > 0 ? <span>{unread}</span> : null}</Link>)}</nav>
        <button className="logout" onClick={onLogout}><LogOut size={18} />تسجيل الخروج</button>
      </aside>
      <section className="workspace">
        <header className="topbar"><Menu /><div><strong>قسم السنترال</strong><small>الاستقبال وتحويل الطلبات</small></div></header>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard app={app} />} />
          <Route path="/customers" element={<Customers app={app} />} />
          <Route path="/customers/new" element={<NewCustomer app={app} />} />
          <Route path="/customers/:id" element={<CustomerProfile app={app} />} />
          <Route path="/requests" element={<Requests app={app} />} />
          <Route path="/requests/new" element={<NewRequest app={app} />} />
          <Route path="/requests/:id" element={<RequestDetails app={app} />} />
          <Route path="/transferred" element={<Transferred app={app} />} />
          <Route path="/follow-ups" element={<FollowUps app={app} />} />
          <Route path="/complaints" element={<Complaints app={app} />} />
          <Route path="/maintenance" element={<Maintenance app={app} />} />
          <Route path="/notifications" element={<Notifications app={app} />} />
          <Route path="/reports" element={<Reports app={app} />} />
          <Route path="/settings" element={<SettingsPage resetData={resetData} />} />
        </Routes>
      </section>
    </div>
  );
}

function Page({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <main className="page"><div className="page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</main>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  const [src, setSrc] = useState(logoSrc);
  return <img className={compact ? "logo compact-logo" : "logo"} src={src} alt="alnaseem" onError={() => setSrc("/blueprint/alnaseem-logo.png")} />;
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return <div className={`stat ${tone}`}>{icon}<div><b>{value}</b><span>{label}</span></div></div>;
}

function Dashboard({ app }: { app: AppState }) {
  const due = app.requests.filter((r) => r.followUpAt || ["بانتظار الاستلام", "بانتظار معلومات", "موعد محدد"].includes(r.status)).slice(0, 6);
  return (
    <Page title="صباح الخير" subtitle="إليك ملخص عمل السنترال اليوم" action={<Link className="primary pill" to="/requests/new"><Plus size={18} />تسجيل اتصال / طلب جديد</Link>}>
      <div className="stats">
        <Stat icon={<Phone />} label="اتصالات اليوم" value={18} tone="green" />
        <Stat icon={<ClipboardList />} label="طلبات جديدة" value={7} tone="blue" />
        <Stat icon={<Clock />} label="بانتظار الاستلام" value={app.requests.filter((r) => r.status === "بانتظار الاستلام").length} tone="orange" />
        <Stat icon={<Bell />} label="تحتاج متابعة" value={due.length} tone="purple" />
      </div>
      <div className="grid two">
        <Card title="الطلبات التي تحتاج متابعة">
          <RequestTable requests={due} customers={app.customers} compact />
        </Card>
        <Card title="تنبيهات سريعة">
          {app.notifications.filter((n) => !n.read).slice(0, 5).map((n) => <div className="notice" key={n.id}><Bell size={18} /><div><b>{n.title}</b><p>{n.description}</p></div></div>)}
        </Card>
      </div>
      <Card title="آخر الاتصالات"><ContactTable contacts={app.contacts.slice(0, 8)} customers={app.customers} /></Card>
    </Page>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="card"><h2>{title}</h2>{children}</section>;
}

function CustomerSearch({ customers, onPick }: { customers: Customer[]; onPick?: (customer: Customer) => void }) {
  const [q, setQ] = useState("");
  const results = q ? customers.filter((c) => `${c.name} ${c.phone} ${c.company ?? ""}`.includes(q)).slice(0, 6) : [];
  return (
    <div className="search-panel">
      <div className="searchbox"><Search size={18} /><input placeholder="ابحث برقم الهاتف أو الاسم أو الشركة" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {q && results.length === 0 && <div className="empty">لم يتم العثور على عميل بهذا الرقم.</div>}
      {results.map((customer) => <CustomerRow key={customer.id} customer={customer} onPick={onPick} />)}
    </div>
  );
}

function CustomerRow({ customer, onPick }: { customer: Customer; onPick?: (customer: Customer) => void }) {
  return (
    <div className="customer-row">
      <div className="avatar"><User /></div>
      <div><b>{customer.name}</b><span>{customer.phone} · {customer.city}</span></div>
      <Badge tone="success">عميل موجود</Badge>
      {onPick ? <button className="secondary" onClick={() => onPick(customer)}>اختيار</button> : <Link className="secondary" to={`/customers/${customer.id}`}>عرض الملف</Link>}
    </div>
  );
}

function Customers({ app }: { app: AppState }) {
  return <Page title="العملاء" subtitle="بحث سريع ونتائج متعددة عند تشابه الأسماء" action={<Link className="primary pill" to="/customers/new"><UserPlus size={18} />إنشاء عميل</Link>}><CustomerSearch customers={app.customers} /><Card title="كل العملاء">{app.customers.slice(0, 12).map((c) => <CustomerRow key={c.id} customer={c} />)}</Card></Page>;
}

function NewCustomer({ app }: { app: AppState }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", altPhone: "", company: "", city: "رام الله", address: "", email: "", notes: "" });
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone) return app.setToast("يرجى استكمال الحقول المطلوبة");
    const duplicate = app.customers.find((c) => c.phone === form.phone);
    if (duplicate) return app.setToast("رقم الهاتف مستخدم مسبقًا");
    const customer: Customer = { id: `c${Date.now()}`, createdAt: new Date().toISOString(), ...form };
    app.setCustomers([customer, ...app.customers]);
    app.setToast("تم حفظ العميل بنجاح");
    navigate(`/requests/new?customer=${customer.id}`);
  };
  return (
    <Page title="إنشاء عميل جديد" subtitle="الاسم ورقم الهاتف إلزاميان">
      <form className="form card" onSubmit={save}>
        <input required placeholder="اسم العميل *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="رقم الهاتف *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="هاتف إضافي" value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} />
        <input placeholder="اسم الشركة" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>{cities.map((city) => <option key={city}>{city}</option>)}</select>
        <input placeholder="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="primary">حفظ العميل</button>
      </form>
    </Page>
  );
}

function CustomerProfile({ app }: { app: AppState }) {
  const { id } = useParams();
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const customer = app.customers.find((c) => c.id === id);
  if (!customer) return <Page title="العميل غير موجود"><Empty /></Page>;
  const customerRequests = app.requests.filter((r) => r.customerId === customer.id);
  const selectedRequest = customerRequests.find((request) => request.id === selectedRequestId) ?? customerRequests[0];
  return (
    <Page title={customer.name} subtitle={`${customer.phone} · ${customer.city}`} action={<Link className="primary pill" to={`/requests/new?customer=${customer.id}`}><Plus size={18} />إنشاء طلب جديد</Link>}>
      {selectedRequest ? (
        <CustomerJourney
          request={selectedRequest}
          requests={customerRequests}
          timelines={app.timelines}
          setTimelines={app.setTimelines}
          setRequests={app.setRequests}
          allRequests={app.requests}
          selectedRequestId={selectedRequestId || selectedRequest.id}
          setSelectedRequestId={setSelectedRequestId}
          setToast={app.setToast}
        />
      ) : null}
      <div className="grid two">
        <Card title="معلومات العميل"><Info rows={[["الهاتف", customer.phone], ["البريد", customer.email ?? "—"], ["المنطقة", customer.city], ["ملاحظات", customer.notes || "—"]]} /></Card>
        <Card title="إجراءات"><div className="actions"><Link className="secondary" to={`/requests/new?customer=${customer.id}`}>تسجيل اتصال</Link><Link className="secondary" to={`/requests/new?customer=${customer.id}`}>إنشاء طلب جديد</Link></div></Card>
      </div>
      <Card title="الطلبات السابقة"><RequestTable requests={customerRequests} customers={app.customers} /></Card>
      <Card title="الاتصالات">{app.contacts.filter((c) => c.customerId === customer.id).map((c) => <div className="notice" key={c.id}><Phone size={18} /><div><b>{c.direction} · {c.result}</b><p>{c.notes}</p></div></div>)}</Card>
    </Page>
  );
}

type JourneyStep = { department: string; label: string };

function journeyStepsFor(request: RequestItem): JourneyStep[] {
  const close = { department: "إغلاق الطلب", label: "انتهاء المعالجة" };
  const paths: Record<RequestType, JourneyStep[]> = {
    "مشروع / زيارة موقع": [
      { department: "قسم السنترال", label: "استقبال الطلب" },
      { department: "قسم المشاريع", label: "المعاينة والتنسيق" },
      { department: "قسم التنسيق الفني", label: "تجهيز المتطلبات الفنية" },
      { department: "قسم الإنتاج", label: "تجهيز التصنيع" },
      { department: "قسم التركيب", label: "التركيب والمتابعة" },
      close,
    ],
    "طلب بيع": [
      { department: "قسم السنترال", label: "استقبال الطلب" },
      { department: "قسم المبيعات", label: "التواصل والعرض" },
      { department: "قسم التنسيق الفني", label: "تأكيد التفاصيل عند الحاجة" },
      { department: "قسم الإنتاج", label: "تجهيز الطلب" },
      close,
    ],
    استفسار: [
      { department: "قسم السنترال", label: "استقبال الاستفسار" },
      { department: "قسم علاقات الزبائن", label: "الرد والمتابعة" },
      close,
    ],
    صيانة: [
      { department: "قسم السنترال", label: "استقبال بلاغ الصيانة" },
      { department: "قسم التركيب", label: "فحص الموقع" },
      { department: "قسم الإنتاج", label: "تجهيز القطع عند الحاجة" },
      { department: "قسم التركيب", label: "تنفيذ الصيانة" },
      close,
    ],
    شكوى: [
      { department: "قسم السنترال", label: "استقبال الشكوى" },
      { department: "قسم علاقات الزبائن", label: "تصنيف الشكوى" },
      { department: complaintDepartment(request), label: "معالجة السبب" },
      { department: "قسم علاقات الزبائن", label: "تأكيد الحل مع العميل" },
      close,
    ],
    متابعة: [
      { department: "قسم السنترال", label: "تسجيل المتابعة" },
      { department: "قسم علاقات الزبائن", label: "متابعة العميل" },
      close,
    ],
    "طلب داخلي": [
      { department: "قسم السنترال", label: "استقبال الطلب" },
      { department: "قسم شؤون الموظفين", label: "المعالجة الداخلية" },
      close,
    ],
    أخرى: [
      { department: "قسم السنترال", label: "استقبال الطلب" },
      { department: employeeName(request.assigneeId), label: "المعالجة حسب التصنيف" },
      close,
    ],
  };
  return paths[request.type];
}

function complaintDepartment(request: RequestItem) {
  if (request.description.includes("تركيب")) return "قسم التركيب";
  if (request.description.includes("تصنيع") || request.description.includes("منتج")) return "قسم الإنتاج";
  return employeeName(request.assigneeId);
}

function journeyIndex(request: RequestItem, steps: JourneyStep[]) {
  if (["مغلق", "ملغي", "مكتمل"].includes(request.status)) return steps.length - 1;
  if (["قيد التنفيذ", "قيد المعالجة", "قيد المتابعة", "موعد محدد", "بانتظار معلومات", "مشكلة", "مؤجل"].includes(request.status)) return Math.min(steps.length - 2, Math.max(2, steps.length - 3));
  if (request.acceptedAt || request.status === "تم الاستلام") return Math.min(2, steps.length - 2);
  if (request.status === "بانتظار الاستلام") return Math.min(1, steps.length - 2);
  if (request.transferredAt) return Math.min(1, steps.length - 2);
  return 0;
}

function stageTime(request: RequestItem, index: number, timelines: TimelineEvent[]) {
  if (index === 0) return request.createdAt;
  if (index === 1) return request.transferredAt || request.createdAt;
  if (index === 2) return request.transferredAt || request.createdAt;
  if (index === 3) return request.acceptedAt || request.transferredAt || request.createdAt;
  const related = timelines.filter((event) => event.requestId === request.id).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return related[0]?.at || request.acceptedAt || request.transferredAt || request.createdAt;
}

function CustomerJourney({
  request,
  requests,
  timelines,
  allRequests,
  selectedRequestId,
  setSelectedRequestId,
  setTimelines,
  setRequests,
  setToast,
}: {
  request: RequestItem;
  requests: RequestItem[];
  timelines: TimelineEvent[];
  allRequests: RequestItem[];
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  setTimelines: (items: TimelineEvent[]) => void;
  setRequests: (items: RequestItem[]) => void;
  setToast: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const steps = journeyStepsFor(request);
  const currentIndex = journeyIndex(request, steps);
  const events = timelines.filter((event) => event.requestId === request.id).slice(0, 5);
  const saveNote = (kind: "تذكير" | "ملاحظة") => {
    if (!note.trim()) return setToast("اكتب التذكير أو الملاحظة أولًا");
    const at = new Date().toISOString();
    const updatedRequests = allRequests.map((item) => item.id === request.id ? { ...item, internalNotes: `${item.internalNotes ? `${item.internalNotes}\n` : ""}${kind}: ${note}` } : item);
    // oxlint-disable-next-line react/purity
    setTimelines([{ id: `t${Date.now()}`, requestId: request.id, at, actor: "قسم السنترال", action: `${kind} إلى ${steps[currentIndex].department}: ${note}` }, ...timelines]);
    setRequests(updatedRequests);
    setNote("");
    setToast(kind === "تذكير" ? "تم حفظ التذكير في سجل الحركة" : "تم حفظ الملاحظة في سجل الحركة");
  };
  return (
    <section className="journey-card">
      <div className="journey-head">
        <div>
          <h2>أين وصل طلب العميل؟</h2>
          <p>الطلب #{request.number} · {request.type} · المرحلة الحالية: {steps[currentIndex].department}</p>
        </div>
        <div className="actions">
          <select value={selectedRequestId} onChange={(event) => setSelectedRequestId(event.target.value)}>
            {requests.map((item) => <option value={item.id} key={item.id}>طلب #{item.number} · {item.status}</option>)}
          </select>
          <button className="secondary" onClick={() => setOpen(!open)}>أين وصل؟</button>
        </div>
      </div>
      <div className="journey-steps">
        {steps.map((step, index) => (
          <button key={`${step.department}-${index}`} className={index <= currentIndex ? "done" : ""} onClick={() => setOpen(true)}>
            <span>{index + 1}</span>
            <b>{step.department}</b>
            <em>{step.label}</em>
            <small>{index <= currentIndex ? formatTime(stageTime(request, index, timelines)) : "لم يصل بعد"}</small>
          </button>
        ))}
      </div>
      {open && (
        <div className="journey-detail">
          <Info rows={[
            ["الحالة الحالية", request.status],
            ["القسم الحالي", steps[currentIndex].department],
            ["طبيعة المرحلة", steps[currentIndex].label],
            ["وقت الوصول الحالي", formatTime(stageTime(request, currentIndex, timelines))],
            ["موعد المتابعة", formatTime(request.followUpAt)],
          ]} />
          <div>
            <h3>آخر حركة</h3>
            {events.map((event) => <div className="timeline compact" key={event.id}><time>{formatTime(event.at)}</time><div><b>{displayDepartmentText(event.actor)}</b><p>{displayDepartmentText(event.action)}</p></div></div>)}
          </div>
          <textarea placeholder="اكتب تذكيرًا للقسم أو ملاحظة داخلية على الطلب" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="actions"><button className="secondary" onClick={() => saveNote("ملاحظة")}>حفظ ملاحظة</button><button className="primary" onClick={() => saveNote("تذكير")}>حفظ تذكير</button></div>
        </div>
      )}
    </section>
  );
}

function NewRequest({ app }: { app: AppState }) {
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialCustomer = app.customers.find((c) => c.id === params.get("customer"));
  const [customer, setCustomer] = useState<Customer | undefined>(initialCustomer);
  const [type, setType] = useState<RequestType>("مشروع / زيارة موقع");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("عادي");
  const [urgentReason, setUrgentReason] = useState("");
  const [assigneeId, setAssigneeId] = useState(routeSuggestion[type]);
  const [followUpAt, setFollowUpAt] = useState("");
  const updateType = (next: RequestType) => { setType(next); setAssigneeId(routeSuggestion[next]); };
  const save = (transfer: boolean) => {
    if (!customer || !description) return app.setToast("يرجى استكمال الحقول المطلوبة");
    if (priority === "عاجل" && !urgentReason) return app.setToast("سبب الاستعجال مطلوب");
    const request: RequestItem = {
      id: `r${Date.now()}`,
      number: Math.max(...app.requests.map((r) => r.number)) + 1,
      customerId: customer.id,
      type,
      description,
      status: transfer ? "بانتظار الاستلام" : "مسودة",
      priority,
      urgentReason,
      assigneeId,
      createdBy: "قسم السنترال",
      createdAt: new Date().toISOString(),
      transferredAt: transfer ? new Date().toISOString() : "",
      followUpAt,
    };
    app.setRequests([request, ...app.requests]);
    app.setTimelines([{ id: `t${Date.now()}`, requestId: request.id, at: request.createdAt, actor: "قسم السنترال", action: transfer ? `تم حفظ وتحويل الطلب إلى ${employeeName(assigneeId)}` : "تم حفظ الطلب كمسودة" }, ...app.timelines]);
    app.setToast(transfer ? `تم تحويل الطلب إلى ${employeeName(assigneeId)}` : "تم إنشاء الطلب");
    navigate(`/requests/${request.id}`);
  };
  return (
    <Page title="تسجيل اتصال / طلب جديد" subtitle="بحث، اختيار عميل، تصنيف، ثم حفظ أو تحويل">
      <div className="grid two">
        <Card title="البحث عن العميل">{customer ? <CustomerRow customer={customer} onPick={() => setCustomer(undefined)} /> : <><CustomerSearch customers={app.customers} onPick={setCustomer} /><Link className="secondary" to="/customers/new">+ إنشاء عميل جديد</Link></>}</Card>
        <section className="card form">
          <h2>بيانات الطلب</h2>
          <select value={type} onChange={(e) => updateType(e.target.value as RequestType)}>{Object.keys(routeSuggestion).map((item) => <option key={item}>{item}</option>)}</select>
          <textarea placeholder="وصف الطلب *" value={description} onChange={(e) => setDescription(e.target.value)} />
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>{employees.map((e) => <option value={e.id} key={e.id}>{e.role}</option>)}</select>
          <div className="segmented">{(["عادي", "مهم", "عاجل"] as Priority[]).map((p) => <button type="button" className={priority === p ? "active" : ""} onClick={() => setPriority(p)} key={p}>{p}</button>)}</div>
          {priority === "عاجل" && <input placeholder="سبب الاستعجال *" value={urgentReason} onChange={(e) => setUrgentReason(e.target.value)} />}
          <input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
          <div className="actions"><button className="secondary" onClick={() => save(false)}>حفظ فقط</button><button className="primary" onClick={() => save(true)}>حفظ وتحويل</button></div>
        </section>
      </div>
    </Page>
  );
}

function Requests({ app }: { app: AppState }) {
  const [filters, setFilters] = useState<RequestFilters>(emptyFilters);
  const list = applyRequestFilters(app.requests, app.customers, filters);
  return <Page title="الطلبات الواردة" subtitle="فلترة حسب الاسم، التاريخ، الحالة، النوع، والجهة"><RequestFilterBar filters={filters} setFilters={setFilters} /><Card title={`قائمة الطلبات (${list.length})`}><RequestTable requests={list} customers={app.customers} /></Card></Page>;
}

function RequestDetails({ app }: { app: AppState }) {
  const { id } = useParams();
  const request = app.requests.find((r) => r.id === id);
  if (!request) return <Page title="الطلب غير موجود"><Empty /></Page>;
  const customer = app.customers.find((c) => c.id === request.customerId)!;
  const events = app.timelines.filter((t) => t.requestId === request.id).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const addContact = () => {
    // oxlint-disable-next-line react/purity
    const contact: ContactLog = { id: `cl${Date.now()}`, customerId: customer.id, requestId: request.id, at: new Date().toISOString(), direction: "صادر", result: "تم التأكيد", notes: "تم إضافة اتصال لاحق وتحديث سجل الطلب.", user: "قسم السنترال" };
    app.setContacts([contact, ...app.contacts]);
    // oxlint-disable-next-line react/purity
    app.setTimelines([{ id: `t${Date.now()}`, requestId: request.id, at: contact.at, actor: "قسم السنترال", action: "تم تسجيل اتصال لاحق: تم التأكيد" }, ...app.timelines]);
    app.setToast("تم تسجيل الاتصال");
  };
  const remind = () => {
    // oxlint-disable-next-line react/purity
    app.setTimelines([{ id: `t${Date.now()}`, requestId: request.id, at: new Date().toISOString(), actor: "قسم السنترال", action: `تم إرسال تذكير إلى ${employeeName(request.assigneeId)}` }, ...app.timelines]);
    app.setToast("تم إرسال تذكير تجريبي");
  };
  return (
    <Page title={`طلب رقم #${request.number}`} subtitle={`${customer.name} · ${request.type}`} action={<Badge tone={statusClass(request.status)}>{request.status}</Badge>}>
      <div className="grid two">
        <Card title="بيانات الطلب"><Info rows={[["العميل", customer.name], ["الهاتف", customer.phone], ["المسؤول الحالي", employeeName(request.assigneeId)], ["الأولوية", request.priority], ["تاريخ التسجيل", formatTime(request.createdAt)], ["موعد المتابعة", formatTime(request.followUpAt)], ["الوصف", request.description]]} /></Card>
        <Card title="إجراءات السنترال"><div className="actions"><button className="secondary" onClick={addContact}>إضافة اتصال لاحق</button>{request.status === "بانتظار الاستلام" && <button className="secondary danger-text" onClick={remind}>تذكير المسؤول</button>}</div>{request.status === "بانتظار الاستلام" && <p className="warning-box">هذا الطلب لم يتم استلامه حتى الآن.</p>}</Card>
      </div>
      <Card title="سجل الحركة">{events.map((event) => <div className="timeline" key={event.id}><time>{formatTime(event.at)}</time><div><b>{displayDepartmentText(event.actor)}</b><p>{displayDepartmentText(event.action)}</p></div></div>)}</Card>
    </Page>
  );
}

function Transferred({ app }: { app: AppState }) {
  const [filters, setFilters] = useState<RequestFilters>({ ...emptyFilters, status: "الكل" });
  const list = applyRequestFilters(app.requests.filter((r) => r.transferredAt), app.customers, filters);
  return <Page title="الطلبات المحولة" subtitle="متابعة وقت التحويل والاستلام حسب الجهة"><RequestFilterBar filters={filters} setFilters={setFilters} /><Card title={`النتائج (${list.length})`}><RequestTable requests={list} customers={app.customers} /></Card></Page>;
}

function FollowUps({ app }: { app: AppState }) {
  const [filters, setFilters] = useState<RequestFilters>(emptyFilters);
  const list = applyRequestFilters(app.requests.filter((r) => r.followUpAt), app.customers, filters);
  return <Page title="المتابعة" subtitle="اليوم، المتأخرة، وهذا الأسبوع"><RequestFilterBar filters={filters} setFilters={setFilters} /><Card title={`قائمة المتابعات (${list.length})`}><RequestTable requests={list} customers={app.customers} /></Card></Page>;
}

function Complaints({ app }: { app: AppState }) {
  return (
    <Page title="الشكاوى والصيانة" subtitle="تسجيل ومتابعة الحالات التي تحتاج عناية" action={<Link className="secondary" to="/maintenance">الصيانة</Link>}>
      <Card title="الشكاوى">{app.complaints.map((c) => <RecordRow key={c.id} title={`${customerName(app.customers, c.customerId)} · ${c.type}`} detail={c.description} badge={c.status} />)}</Card>
    </Page>
  );
}

function Maintenance({ app }: { app: AppState }) {
  return <Page title="الصيانة" subtitle="تحويل افتراضي إلى قسم التركيب مع إشراك الإنتاج عند الحاجة"><Card title="طلبات الصيانة">{app.maintenance.map((m) => <RecordRow key={m.id} title={`${customerName(app.customers, m.customerId)} · ${m.product}`} detail={m.issue} badge={m.status} />)}</Card></Page>;
}

function Notifications({ app }: { app: AppState }) {
  const markAll = () => { app.setNotifications(app.notifications.map((n) => ({ ...n, read: true }))); app.setToast("تم تعليم الكل كمقروء"); };
  return <Page title="الإشعارات" action={<button className="secondary" onClick={markAll}>تعليم الكل كمقروء</button>}><Card title="التنبيهات">{app.notifications.map((n) => <div className={`notice ${n.read ? "read" : ""}`} key={n.id}><Bell size={18} /><div><b>{n.title}</b><p>{n.description} · {formatTime(n.at)}</p></div>{n.requestId && <Link className="secondary" to={`/requests/${n.requestId}`}>فتح الطلب</Link>}</div>)}</Card></Page>;
}

function Reports({ app }: { app: AppState }) {
  const [filters, setFilters] = useState<ReportFilters>({ ...emptyFilters, customerId: "الكل" });
  const filtered = applyRequestFilters(app.requests, app.customers, filters).filter((request) => filters.customerId === "الكل" || request.customerId === filters.customerId);
  const waiting = filtered.filter((request) => request.status === "بانتظار الاستلام").length;
  const urgent = filtered.filter((request) => request.priority === "عاجل").length;
  const openComplaints = app.complaints.filter((complaint) => complaint.status !== "تم الحل").length;
  return (
    <Page title="التقارير" subtitle="تقارير قابلة للفلترة والطباعة" action={<button className="primary pill no-print" onClick={() => window.print()}><Printer size={18} />طباعة / حفظ PDF</button>}>
      <section className="report-surface">
        <ReportFilterBar filters={filters} setFilters={setFilters} customers={app.customers} />
        <div className="stats report-stats">
          <Stat icon={<ClipboardList />} label="إجمالي الطلبات" value={filtered.length} tone="blue" />
          <Stat icon={<Clock />} label="بانتظار الاستلام" value={waiting} tone="orange" />
          <Stat icon={<Bell />} label="طلبات عاجلة" value={urgent} tone="purple" />
          <Stat icon={<MessageSquareWarning />} label="شكاوى مفتوحة" value={openComplaints} tone="green" />
        </div>
        <div className="grid two">
          <Card title="ملخص حسب القسم">{employees.map((employee) => <RecordRow key={employee.id} title={employee.role} detail={`${filtered.filter((request) => normalizeAssigneeId(request.assigneeId) === employee.id).length} طلب`} badge="قسم" />)}</Card>
          <Card title="ملخص حسب نوع الطلب">{Object.keys(routeSuggestion).map((type) => <RecordRow key={type} title={type} detail={`${filtered.filter((request) => request.type === type).length} طلب`} badge="نوع" />)}</Card>
        </div>
        <Card title={`نتائج التقرير (${filtered.length})`}><RequestTable requests={filtered} customers={app.customers} /></Card>
      </section>
    </Page>
  );
}

function SettingsPage({ resetData }: { resetData: () => void }) {
  return (
    <Page title="الإعدادات" subtitle="إعدادات محلية للنظام">
      <Card title="إعدادات النظام">
        <Info rows={[["مدة تأخر الاستلام", "30 دقيقة"], ["مصدر البيانات", "تخزين محلي في المتصفح فقط"]]} />
        <button className="secondary danger-text" onClick={() => confirm("إعادة البيانات؟") && resetData()}>إعادة البيانات</button>
      </Card>
    </Page>
  );
}

const emptyFilters: RequestFilters = { query: "", status: "الكل", type: "الكل", assigneeId: "الكل", dateFrom: "", dateTo: "" };

function RequestFilterBar({ filters, setFilters }: { filters: RequestFilters; setFilters: (v: RequestFilters) => void }) {
  return (
    <section className="filter-panel">
      <div className="filter-title"><SlidersHorizontal size={18} /><b>فلترة النتائج</b></div>
      <div className="filter-grid">
        <label><Search size={16} /><input placeholder="اسم العميل أو رقم الطلب أو الهاتف" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} /></label>
        <label><Clock size={16} /><input aria-label="من تاريخ" type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></label>
        <label><Clock size={16} /><input aria-label="إلى تاريخ" type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></label>
        <label><FilterIcon size={16} /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>{["الكل", "مسودة", "بانتظار الاستلام", "تم الاستلام", "قيد المتابعة", "بانتظار معلومات", "موعد محدد", "قيد التنفيذ", "مغلق", "ملغي"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><ClipboardList size={16} /><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>{["الكل", ...Object.keys(routeSuggestion)].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><Users size={16} /><select value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}><option>الكل</option>{employees.map((e) => <option value={e.id} key={e.id}>{e.role}</option>)}</select></label>
        <button className="secondary" onClick={() => setFilters(emptyFilters)}>مسح الفلاتر</button>
      </div>
    </section>
  );
}

function ReportFilterBar({ filters, setFilters, customers }: { filters: ReportFilters; setFilters: (v: ReportFilters) => void; customers: Customer[] }) {
  return (
    <section className="filter-panel no-print">
      <div className="filter-title"><SlidersHorizontal size={18} /><b>فلاتر التقرير</b></div>
      <div className="filter-grid report-filter-grid">
        <label><Search size={16} /><input placeholder="بحث بالاسم أو الهاتف أو رقم الطلب" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} /></label>
        <label><Clock size={16} /><input aria-label="من تاريخ" type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></label>
        <label><Clock size={16} /><input aria-label="إلى تاريخ" type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></label>
        <label><User size={16} /><select value={filters.customerId} onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}><option>الكل</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
        <label><FilterIcon size={16} /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>{["الكل", "مسودة", "بانتظار الاستلام", "تم الاستلام", "قيد المتابعة", "بانتظار معلومات", "موعد محدد", "قيد التنفيذ", "مغلق", "ملغي"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><ClipboardList size={16} /><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>{["الكل", ...Object.keys(routeSuggestion)].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><Users size={16} /><select value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}><option>الكل</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.role}</option>)}</select></label>
        <button className="secondary" onClick={() => setFilters({ ...emptyFilters, customerId: "الكل" })}>مسح الفلاتر</button>
      </div>
    </section>
  );
}

function applyRequestFilters(requests: RequestItem[], customers: Customer[], filters: RequestFilters) {
  const q = filters.query.trim();
  return requests.filter((request) => {
    const customer = customers.find((item) => item.id === request.customerId);
    const haystack = `${request.number} ${request.type} ${request.description} ${customer?.name ?? ""} ${customer?.phone ?? ""} ${customer?.company ?? ""}`;
    const dates = [request.createdAt, request.followUpAt, request.transferredAt, request.acceptedAt].filter(Boolean).map((value) => value!.slice(0, 10));
    const dateOk = dates.some((date) => (!filters.dateFrom || date >= filters.dateFrom) && (!filters.dateTo || date <= filters.dateTo));
    return (!q || haystack.includes(q))
      && (filters.status === "الكل" || request.status === filters.status)
      && (filters.type === "الكل" || request.type === filters.type)
      && (filters.assigneeId === "الكل" || normalizeAssigneeId(request.assigneeId) === filters.assigneeId)
      && dateOk;
  });
}

function RequestTable({ requests, customers, compact = false }: { requests: RequestItem[]; customers: Customer[]; compact?: boolean }) {
  return (
    <div className="table-wrap"><table><thead><tr><th>#</th><th>العميل</th><th>النوع</th>{!compact && <th>المسؤول</th>}<th>آخر تحديث</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{requests.map((r) => <tr key={r.id}><td>#{r.number}</td><td>{customerName(customers, r.customerId)}</td><td>{r.type}</td>{!compact && <td>{employeeName(r.assigneeId)}</td>}<td>{formatTime(r.acceptedAt || r.transferredAt || r.createdAt)}</td><td><Badge tone={statusClass(r.status)}>{r.status}</Badge></td><td><Link className="secondary" to={`/requests/${r.id}`}>فتح</Link></td></tr>)}</tbody></table></div>
  );
}

function ContactTable({ contacts, customers }: { contacts: ContactLog[]; customers: Customer[] }) {
  return <div className="table-wrap"><table><thead><tr><th>الوقت</th><th>العميل</th><th>نوع الاتصال</th><th>الحالة</th><th>المسؤول</th></tr></thead><tbody>{contacts.map((c) => <tr key={c.id}><td>{formatTime(c.at)}</td><td>{customerName(customers, c.customerId)}</td><td>{c.direction}</td><td>{c.result}</td><td>{displayDepartmentText(c.user)}</td></tr>)}</tbody></table></div>;
}

function Info({ rows }: { rows: [string, string][] }) {
  return <dl className="info">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

function RecordRow({ title, detail, badge }: { title: string; detail: string; badge: string }) {
  return <div className="record-row"><div><b>{title}</b><p>{detail}</p></div><Badge tone={statusClass(badge)}>{badge}</Badge></div>;
}

function Empty() {
  return <div className="empty"><ShieldCheck />لا توجد بيانات للعرض.</div>;
}

function customerName(customers: Customer[], id: string) {
  return customers.find((c) => c.id === id)?.name ?? "عميل غير معروف";
}

export default App;
