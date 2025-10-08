import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PasswordStrengthService } from '../services/password-strength.service';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  private passwordStrengthService = new PasswordStrengthService();

  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    const strength = this.passwordStrengthService.calculateStrength(password);
    return strength.isStrong;
  }

  defaultMessage(args: ValidationArguments) {
    const password = args.value;
    if (!password) return 'Password is required';

    const strength = this.passwordStrengthService.calculateStrength(password);
    return `Password is too weak. ${strength.feedback.join(', ')}`;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
