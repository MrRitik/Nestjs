import { Expose } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  @Expose()
  id: number;

  @Column({ unique: true, name: 'user_name' })
  @Expose()
  username: string;

  @Column('varchar', { length: 200, name: 'password' })
  password: string;

  @Column({ name: 'email' })
  @Expose()
  email: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
