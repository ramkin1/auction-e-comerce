import { useAuth } from "@/_core/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@/const";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, BarChart3, Package, Users, CreditCard, Settings } from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [itemsPage, setItemsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  // Check admin access
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Admin access required.</p>
            <Button asChild className="bg-primary text-primary-foreground font-bold uppercase tracking-wider">
              <a href="/">Back to Home</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Administration
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
        </div>
      </div>

      <div className="container py-10 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted p-1 border border-border">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Analytics ────────────────────────────────────────────────── */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* ─── Items ────────────────────────────────────────────────────── */}
          <TabsContent value="items">
            <ItemsTab page={itemsPage} setPage={setItemsPage} />
          </TabsContent>

          {/* ─── Users ────────────────────────────────────────────────────── */}
          <TabsContent value="users">
            <UsersTab page={usersPage} setPage={setUsersPage} />
          </TabsContent>

          {/* ─── Payments ─────────────────────────────────────────────────── */}
          <TabsContent value="payments">
            <PaymentsTab page={paymentsPage} setPage={setPaymentsPage} />
          </TabsContent>

          {/* ─── Moderation ───────────────────────────────────────────────── */}
          <TabsContent value="moderation">
            <ModerationTab />
          </TabsContent>

          {/* ─── Settings ─────────────────────────────────────────────────── */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: analytics, isLoading } = trpc.admin.analytics.useQuery();

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-muted-foreground">No data available</div>;
  }

  const metrics = [
    { label: "Total Auctions", value: analytics.totalItems, icon: "📦" },
    { label: "Active Auctions", value: analytics.activeItems, icon: "🔴" },
    { label: "Total Users", value: analytics.totalUsers, icon: "👥" },
    { label: "Total Bids", value: analytics.totalBids, icon: "🔨" },
    { label: "Completed Payments", value: analytics.completedPayments, icon: "✅" },
    { label: "Total Revenue", value: formatKES(analytics.totalRevenue), icon: "💰" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {metric.label}
                </p>
                <p className="text-3xl font-black">{metric.value}</p>
              </div>
              <span className="text-2xl">{metric.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {analytics.topItems.length > 0 && (
        <div className="border border-border p-6">
          <h3 className="font-black text-lg mb-4">Top Items by Bids</h3>
          <div className="space-y-3">
            {analytics.topItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.bidCount} bids</p>
                </div>
                <p className="font-bold text-primary">{formatKES(item.currentPrice)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemsTab({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data: result, isLoading } = trpc.admin.items.useQuery({ page, limit: 20 });
  const updateStatus = trpc.admin.updateItemStatus.useMutation({
    onSuccess: () => {
      toast.success("Item status updated");
    },
  });
  const deleteItem = trpc.admin.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("Item deleted");
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left p-3 font-bold">Title</th>
              <th className="text-left p-3 font-bold">Category</th>
              <th className="text-right p-3 font-bold">Price</th>
              <th className="text-center p-3 font-bold">Bids</th>
              <th className="text-center p-3 font-bold">Status</th>
              <th className="text-center p-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                <td className="p-3 font-semibold">{item.title}</td>
                <td className="p-3 text-muted-foreground">{item.category}</td>
                <td className="p-3 text-right font-bold">{formatKES(item.currentPrice)}</td>
                <td className="p-3 text-center">{item.bidCount}</td>
                <td className="p-3 text-center">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateStatus.mutate({ id: item.id, status: e.target.value as any })
                    }
                    className="px-2 py-1 border border-border text-xs font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                    <option value="sold">Sold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="p-3 text-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteItem.mutate({ id: item.id })}
                    disabled={deleteItem.isPending}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm font-semibold">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data: result, isLoading } = trpc.admin.users.useQuery({ page, limit: 20 });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  const users = result?.users ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left p-3 font-bold">Name</th>
              <th className="text-left p-3 font-bold">Email</th>
              <th className="text-center p-3 font-bold">Role</th>
              <th className="text-left p-3 font-bold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                    className="px-2 py-1 border border-border text-xs font-semibold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm font-semibold">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const { data: result, isLoading } = trpc.admin.payments.useQuery({ page, limit: 20 });
  const updateStatus = trpc.admin.updatePaymentStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment status updated");
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  const payments = result?.payments ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left p-3 font-bold">User</th>
              <th className="text-left p-3 font-bold">Item</th>
              <th className="text-right p-3 font-bold">Amount</th>
              <th className="text-center p-3 font-bold">Status</th>
              <th className="text-left p-3 font-bold">M-Pesa Code</th>
              <th className="text-left p-3 font-bold">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                <td className="p-3 font-semibold">{p.userName}</td>
                <td className="p-3 text-muted-foreground">{p.itemTitle}</td>
                <td className="p-3 text-right font-bold">{formatKES(p.amount)}</td>
                <td className="p-3 text-center">
                  <select
                    value={p.status}
                    onChange={(e) =>
                      updateStatus.mutate({ id: p.id, status: e.target.value as any })
                    }
                    className="px-2 py-1 border border-border text-xs font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>
                <td className="p-3 text-muted-foreground text-xs font-mono">{p.mpesaCode || "—"}</td>
                <td className="p-3 text-muted-foreground text-xs">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm font-semibold">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModerationTab() {
  const [reportPage, setReportPage] = useState(1);
  const [reportStatus, setReportStatus] = useState<'pending' | undefined>('pending');
  const { data: result, isLoading } = trpc.admin.moderationReports.useQuery({
    page: reportPage,
    status: reportStatus,
    limit: 20,
  });
  const updateReport = trpc.admin.updateModerationReport.useMutation({
    onSuccess: () => {
      toast.success('Report updated');
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  const reports = result?.reports ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  if (!reports.length) {
    return (
      <div className="border border-dashed border-foreground/20 py-12 text-center">
        <p className="text-muted-foreground font-medium">No moderation reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={reportStatus === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setReportStatus('pending');
            setReportPage(1);
          }}
        >
          Pending
        </Button>
        <Button
          variant={reportStatus === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setReportStatus(undefined);
            setReportPage(1);
          }}
        >
          All
        </Button>
      </div>

      <div className="space-y-3">
        {reports.map((report: any) => (
          <div key={report.id} className="border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold">{report.type.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
                {report.adminNotes && (
                  <p className="text-xs text-foreground mt-2 bg-muted p-2">Admin: {report.adminNotes}</p>
                )}
              </div>
              <select
                value={report.status}
                onChange={(e) =>
                  updateReport.mutate({
                    reportId: report.id,
                    status: e.target.value as any,
                  })
                }
                className="px-2 py-1 border border-border text-xs font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {(reportPage - 1) * 20 + 1} to {Math.min(reportPage * 20, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportPage(reportPage - 1)}
            disabled={reportPage === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm font-semibold">
            {reportPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportPage(reportPage + 1)}
            disabled={reportPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { data: settings, isLoading } = trpc.admin.settings.useQuery();

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border border-border p-6">
        <h3 className="font-black text-lg mb-4">Auction Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Minimum Bid Increment (KES)</label>
            <input
              type="number"
              defaultValue={settings?.minBidIncrement}
              className="w-full px-3 py-2 border border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Default Auction Duration (Days)</label>
            <input
              type="number"
              defaultValue={settings?.auctionDurationDays}
              className="w-full px-3 py-2 border border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Platform Fee (%)</label>
            <input
              type="number"
              defaultValue={settings?.platformFeePercent}
              className="w-full px-3 py-2 border border-border"
            />
          </div>
          <Button className="bg-primary text-primary-foreground font-bold uppercase tracking-wider">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
