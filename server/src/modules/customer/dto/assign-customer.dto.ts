import { IsUUID } from 'class-validator';

export class AssignCustomerDto {
  /** User in your organization to assign this customer to (must stay under max-customer limit). */
  @IsUUID('4')
  assignToUserId!: string;
}
