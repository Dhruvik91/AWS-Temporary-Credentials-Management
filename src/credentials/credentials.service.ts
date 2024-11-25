import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  IAMClient, 
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand 
} from '@aws-sdk/client-iam';
import { 
  STSClient,
  GetFederationTokenCommand 
} from '@aws-sdk/client-sts';
import { Credential } from '../entities/credential.entity';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CredentialsService {
  private iamClient: IAMClient;
  private stsClient: STSClient;

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private auditService: AuditService,
  ) {
    this.iamClient = new IAMClient({ region: process.env.AWS_REGION });
    this.stsClient = new STSClient({ region: process.env.AWS_REGION });
  }

  async createTemporaryCredentials(user: User) {
    try {
      // Create programmatic access keys
      const createKeyCommand = new CreateAccessKeyCommand({});
      const accessKey = await this.iamClient.send(createKeyCommand);

      // Get federation token for console access
      const getFederationTokenCommand = new GetFederationTokenCommand({
        Name: user.username,
        DurationSeconds: 3600,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: '*',
            Resource: '*'
          }]
        })
      });
      const federationToken = await this.stsClient.send(getFederationTokenCommand);

      // Save credentials
      const credential = this.credentialRepository.create({
        user,
        accessKeyId: accessKey.AccessKey.AccessKeyId,
        secretAccessKey: accessKey.AccessKey.SecretAccessKey,
        consoleUsername: federationToken.Credentials.AccessKeyId,
        consolePassword: federationToken.Credentials.SecretAccessKey,
        expiresAt: federationToken.Credentials.Expiration,
      });

      await this.credentialRepository.save(credential);

      // Log audit
      await this.auditService.log({
        user,
        action: 'CREATE',
        resourceType: 'CREDENTIAL',
        resourceId: credential.id,
        details: { type: 'TEMPORARY_CREDENTIALS' }
      });

      return credential;
    } catch (error) {
      throw new Error(`Failed to create temporary credentials: ${error.message}`);
    }
  }

  async deleteCredentials(id: string, user: User) {
    const credential = await this.credentialRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    if (credential.user.id !== user.id && user.role !== 'ADMIN') {
      throw new UnauthorizedException();
    }

    try {
      // Delete AWS access key
      const deleteKeyCommand = new DeleteAccessKeyCommand({
        AccessKeyId: credential.accessKeyId,
      });
      await this.iamClient.send(deleteKeyCommand);

      // Delete from database
      await this.credentialRepository.remove(credential);

      // Log audit
      await this.auditService.log({
        user,
        action: 'DELETE',
        resourceType: 'CREDENTIAL',
        resourceId: id,
        details: { type: 'TEMPORARY_CREDENTIALS' }
      });

    } catch (error) {
      throw new Error(`Failed to delete credentials: ${error.message}`);
    }
  }
}