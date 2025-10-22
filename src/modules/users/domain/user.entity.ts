export class UserEntity {
  public readonly id: string;
  public readonly businessId: string;
  public readonly clerkId: string;
  public readonly name: string;

  constructor(params: {
    id: string;
    businessId: string;
    clerkId: string;
    name: string;
  }) {
    const { businessId, clerkId, name } = params;

    if (!businessId || businessId.trim().length === 0) {
      throw new Error('Business ID is required');
    }

    if (!clerkId || clerkId.trim().length === 0) {
      throw new Error('Clerk ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    this.businessId = businessId;
    this.name = name;
    this.clerkId = clerkId;
  }
}
