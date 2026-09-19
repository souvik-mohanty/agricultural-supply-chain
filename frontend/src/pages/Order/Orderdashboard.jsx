import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import OrderForm from "./OrderForm";

const OrderDashboard = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Mock data for demonstration
  const recentOrders = [
    {
      id: "ORD-001",
      customerName: "John Smith Farm",
      orderType: "Seeds & Planting",
      total: 1250.00,
      status: "pending",
      date: "2024-01-15",
      items: 3
    },
    {
      id: "ORD-002",
      customerName: "Green Valley Agriculture",
      orderType: "Fertilizers & Chemicals",
      total: 2100.50,
      status: "completed",
      date: "2024-01-14",
      items: 5
    },
    {
      id: "ORD-003",
      customerName: "Sunrise Dairy Farm",
      orderType: "Livestock & Feed",
      total: 850.75,
      status: "processing",
      date: "2024-01-13",
      items: 2
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-warning/20 text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-primary/20 text-primary"><AlertCircle className="w-3 h-3 mr-1" />Processing</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-success/20 text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (showOrderForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Order</h2>
          <Button variant="outline" onClick={() => setShowOrderForm(false)}>
            Back to Dashboard
          </Button>
        </div>
        <OrderForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Order Management</h2>
          <p className="text-muted-foreground">Manage farm orders and track deliveries</p>
        </div>
        <Button onClick={() => setShowOrderForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">23</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">1,156</div>
            <p className="text-xs text-muted-foreground">
              94% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest farm orders and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium leading-none">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.orderType}</p>
                        <p className="text-sm text-muted-foreground">{order.items} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>Orders awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No pending orders at the moment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing Orders</CardTitle>
              <CardDescription>Orders currently being processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No orders in processing</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>Successfully completed orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No completed orders to display</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDashboard;