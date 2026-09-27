export class UserCreateDto {
  clerkId: string;
  name: string;
  imageUrl?: string | null;
}

export class UserUpdateDto {
  clerkId: string;
  businessId?: string;
  name?: string;
  imageUrl?: string | null;
}
