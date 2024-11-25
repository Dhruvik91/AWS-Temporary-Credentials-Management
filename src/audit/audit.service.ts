import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    user: User;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
  }) {
    const auditLog = this.auditLogRepository.create({
      user: data.user,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ) {
    const query = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .where('auditLog.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    return query.getMany();
  }
}