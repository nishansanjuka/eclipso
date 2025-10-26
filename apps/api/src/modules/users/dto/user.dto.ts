export class UserCreateDto {
  clerkId: string;
  name: string;
}

export class UserUpdateDto {
  clerkId: string;
  businessId?: string;
  name?: string;
}
