
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Package, Building2, ShoppingCart, AlertCircle } from 'lucide-react';

const DashboardOverview: React.FC = () => {
  const stats = [
    {
      title: 'Active Suppliers',
      value: '12',
      change: '+2 this month',
      trend: 'up',
      icon: Building2,
    },
    {
      title: 'Catalog Items',
      value: '2,847',
      change: '+156 this week',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Monthly Orders',
      value: '47',
      change: '-3 vs last month',
      trend: 'down',
      icon: ShoppingCart,
    },
    {
      title: 'Avg Savings',
      value: '12.4%',
      change: '+2.1% improvement',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    {
      type: 'price_update',
      message: 'Price update from Véfkaupmenn - 23 items updated',
      time: '2 hours ago',
      severity: 'info',
    },
    {
      type: 'order_sent',
      message: 'Order #2024-001 sent to 3 suppliers',
      time: '4 hours ago',
      severity: 'success',
    },
    {
      type: 'connection_issue',
      message: 'Failed to sync with Heilsuhúsið portal',
      time: '6 hours ago',
      severity: 'warning',
    },
    {
      type: 'match_found',
      message: '12 new product matches identified',
      time: '1 day ago',
      severity: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title} className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendIcon className={`h-3 w-3 mr-1 ${
                    stat.trend === 'up' ? 'text-success' : 'text-warning'
                  }`} />
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.severity === 'success' ? 'bg-success' :
                    activity.severity === 'warning' ? 'bg-warning' :
                    activity.severity === 'error' ? 'bg-error' :
                    'bg-primary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-md bg-warning/10 border border-warning/20">
                <AlertCircle className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Significant Price Increase</p>
                  <p className="text-xs text-muted-foreground">Olive oil prices up 15% at Véfkaupmenn</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-md bg-success/10 border border-success/20">
                <TrendingDown className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Better Deal Found</p>
                  <p className="text-xs text-muted-foreground">Cheese selection 8% cheaper at Heilsuhúsið</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-md bg-primary/10 border border-primary/20">
                <Package className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">New Products</p>
                  <p className="text-xs text-muted-foreground">47 new items from Matfuglinn this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
