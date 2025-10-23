import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface RdsStackProps extends cdk.StackProps {
  myIp: string;
}

export class RdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Security group allowing Postgres from single IP
    const sg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Allow Postgres from dev IP',
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.ipv4(`${props.myIp}/32`), ec2.Port.tcp(5432), 'Allow Postgres from dev IP');

    // Secret for DB credentials
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'tamu' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 24,
      },
    });

    const subnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for law portal rds',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const db = new rds.DatabaseInstance(this, 'LawPostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      // Use a smaller instance type compatible with free-tier/limited accounts
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      credentials: rds.Credentials.fromSecret(dbSecret),
      allocatedStorage: 20,
      databaseName: 'law_portal',
      securityGroups: [sg],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      publiclyAccessible: true,
    });

    new cdk.CfnOutput(this, 'DBEndpoint', { value: db.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'SecretArn', { value: dbSecret.secretArn });
  }
}
