import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';

interface RdsStackProps extends cdk.StackProps {
  myIp: string;
}

export class RdsStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    // Use the default VPC in us-east-1
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Security group allowing Postgres from specific IP
    // Update this IP when deploying from a new location
    const sg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Allow Postgres access from authorized IPs',
      allowAllOutbound: true,
    });
    
    // Allow access from your development IP
    sg.addIngressRule(
      ec2.Peer.ipv4(`${props.myIp}/32`), 
      ec2.Port.tcp(5432), 
      'Allow Postgres from dev IP'
    );
    
    // Optional: Allow access from EC2 instance if you deploy one
    // sg.addIngressRule(ec2.Peer.securityGroupId('sg-xxxxx'), ec2.Port.tcp(5432), 'Allow from EC2');

    // KMS key for RDS encryption at rest
    const kmsKey = new kms.Key(this, 'RdsKmsKey', {
      description: 'KMS key for TAMU Law Portal RDS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep key even if stack is deleted
    });

    // Secret for DB credentials (stored in Secrets Manager)
    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      description: 'TAMU Law Portal PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'tamu' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 24,
      },
    });

    // Subnet group for RDS (uses public subnets for accessibility)
    const subnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for law portal RDS',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // RDS PostgreSQL 16 instance with pgvector support
    this.dbInstance = new rds.DatabaseInstance(this, 'LawPostgres', {
      // Engine: PostgreSQL 16.8 (latest minor version for pgvector compatibility)
      engine: rds.DatabaseInstanceEngine.postgres({ 
        version: rds.PostgresEngineVersion.VER_16 
      }),
      // Instance type: t3.micro (eligible for free tier)
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      
      // Credentials from Secrets Manager
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      
      // Storage: 20GB SSD (free tier eligible)
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable auto-scaling up to 100GB
      storageType: rds.StorageType.GP3,
      
      // Database name
      databaseName: 'law_portal',
      
      // Security
      securityGroups: [sg],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      
      // Backup settings
      backupRetention: cdk.Duration.days(1), // Minimum backups (reduce costs)
      preferredBackupWindow: '08:57-09:27', // UTC time window
      
      // Maintenance
      preferredMaintenanceWindow: 'sat:05:10-sat:05:40', // Saturday early morning UTC
      
      // Availability (single-AZ for cost savings)
      multiAz: false,
      
      // Public access (required for external connections)
      publiclyAccessible: true,
      
      // Deletion settings (set to RETAIN for production)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // CHANGE TO RETAIN FOR PRODUCTION
      deletionProtection: false, // CHANGE TO true FOR PRODUCTION
      
      // Performance Insights (optional, adds $0.01/hour = $7/month)
      enablePerformanceInsights: false,
      
      // CloudWatch Logs exports (optional)
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: 7, // Keep logs for 7 days
    });

    // Outputs for easy reference
    new cdk.CfnOutput(this, 'DBEndpoint', { 
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint',
      exportName: 'LawPortalDBEndpoint',
    });
    
    new cdk.CfnOutput(this, 'DBPort', { 
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'RDS PostgreSQL port',
    });
    
    new cdk.CfnOutput(this, 'SecretArn', { 
      value: this.dbSecret.secretArn,
      description: 'Secrets Manager ARN for DB credentials',
      exportName: 'LawPortalDBSecretArn',
    });
    
    new cdk.CfnOutput(this, 'SecurityGroupId', { 
      value: sg.securityGroupId,
      description: 'RDS Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseName', { 
      value: 'law_portal',
      description: 'Database name',
    });
  }
}
