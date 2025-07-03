import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column('varchar', { length: 200 })
  password: string;

  @Column()
  email: string;

  @Column()
  createdAt: Date;
}
