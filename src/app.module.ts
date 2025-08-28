import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AdminModule } from './admin/admin.module';
import { CylinderModule } from './cylinder/cylinder.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://adelwinelisha:vqpy8TZCbwst5MhU@ondegoo-trial.gmnmugn.mongodb.net/?retryWrites=true&w=majority&appName=Ondegoo-trial'),
    OrderModule,
    UserModule,
    PaymentModule,
    DeliveryModule,
    AdminModule,
    CylinderModule,
    SupportTicketModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
