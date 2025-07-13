import { Expose } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  @Expose()
  id: string;

  @Column({ unique: true, name: 'user_name' })
  @Expose()
  username: string;

  @Column('varchar', { length: 200, name: 'password' })
  password: string;

  @Column({ name: 'email' })
  @Expose()
  email: string;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  refreshToken: string | null;

  @Column({
    name: 'expiry_in',
    type: 'timestamp',
    nullable: true,
  })
  expiryIn: Date | null;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
