export interface UserRecord {
  id: string;
  phone: string;
  name: string | null;
  username: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findByPhone(phone: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: { phone: string; name?: string }): Promise<UserRecord>;
  findOrCreateByPhone(phone: string): Promise<UserRecord>;
  updateProfile(id: string, data: { name: string; username: string; email: string }): Promise<UserRecord>;
}
