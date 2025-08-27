import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

/**
 * Team entity
 */
@Entity('teams', { schema: 'workflow_service' })
export class Team extends BaseEntity {
  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'teamlead_agent_id' })
  @Index()
  teamleadAgentId: string;

  @ManyToOne(() => Agent, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teamlead_agent_id' })
  teamleadAgent: Agent;

  @Column()
  @Index()
  department: string;

  @Column()
  @Index()
  center: string;

  @Column()
  @Index()
  region: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;
}