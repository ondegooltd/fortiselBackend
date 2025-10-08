import { CylinderSize } from '../cylinder.schema';

export class Cylinder {
  id: string;
  cylinderId: string;
  size: CylinderSize;
  deliveryFee: number;
  description: string;
  createdAt: Date;
}
