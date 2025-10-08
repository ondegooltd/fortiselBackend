import { Controller, Get, Query, Param } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payment/payment.service';
import { DeliveryService } from '../delivery/delivery.service';
import { UserRole } from '../user/user.schema';
import { PaymentStatus } from '../payment/payment.schema';
import { DeliveryStatus } from '../delivery/delivery.schema';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    private readonly deliveryService: DeliveryService,
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    const [orders, users, payments, deliveries] = await Promise.all([
      this.orderService.findAll(),
      this.userService.findAll(),
      this.paymentService.findAll(),
      this.deliveryService.findAll(),
    ]);

    const customers = users.filter((user) => user.role === UserRole.CUSTOMER);
    const drivers = users.filter((user) => user.role === UserRole.DRIVER);
    const successfulPayments = payments.filter(
      (payment) => payment.status === PaymentStatus.SUCCESSFUL,
    );
    const pendingDeliveries = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.PENDING,
    );

    const totalRevenue = successfulPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return {
      stats: {
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalDrivers: drivers.length,
        totalRevenue,
        pendingDeliveries: pendingDeliveries.length,
        successfulPayments: successfulPayments.length,
      },
      recentOrders: orders.slice(-5).reverse(),
      recentPayments: payments.slice(-5).reverse(),
    };
  }

  @Get('orders/analytics')
  async getOrderAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const orders = await this.orderService.getOrdersByDateRange(start, end);

    // Group orders by cylinder size
    const cylinderSizeStats = orders.reduce((acc, order) => {
      acc[order.cylinderSize] = (acc[order.cylinderSize] || 0) + 1;
      return acc;
    }, {});

    // Group orders by date
    const dailyStats = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders: orders.length,
      cylinderSizeStats,
      dailyStats,
      orders,
    };
  }

  @Get('users/customers')
  async getCustomers() {
    const users = await this.userService.findAll();
    return users.filter((user) => user.role === UserRole.CUSTOMER);
  }

  @Get('users/drivers')
  async getDrivers() {
    const users = await this.userService.findAll();
    return users.filter((user) => user.role === UserRole.DRIVER);
  }

  @Get('payments/analytics')
  async getPaymentAnalytics() {
    const payments = await this.paymentService.findAll();

    const statusStats = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    const providerStats = payments.reduce((acc, payment) => {
      acc[payment.provider] = (acc[payment.provider] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = payments
      .filter((payment) => payment.status === PaymentStatus.SUCCESSFUL)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalPayments: payments.length,
      statusStats,
      providerStats,
      totalRevenue,
      payments: payments.slice(-10).reverse(),
    };
  }

  @Get('deliveries/analytics')
  async getDeliveryAnalytics() {
    const deliveries = await this.deliveryService.findAll();

    const statusStats = deliveries.reduce((acc, delivery) => {
      acc[delivery.status] = (acc[delivery.status] || 0) + 1;
      return acc;
    }, {});

    const pendingDeliveries = await this.deliveryService.getPendingDeliveries();

    return {
      totalDeliveries: deliveries.length,
      statusStats,
      pendingDeliveries,
      deliveries: deliveries.slice(-10).reverse(),
    };
  }

  @Get('orders/:orderId/details')
  async getOrderDetails(@Param('orderId') orderId: string) {
    const order = await this.orderService.findByOrderId(orderId);
    const payments = await this.paymentService.findByOrderId(order.id);
    const deliveries = await this.deliveryService.findByOrderId(order.id);

    return {
      order,
      payments,
      deliveries,
    };
  }
}
