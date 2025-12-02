import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * OPTIONAL EC2 Stack for AWS Deployment
 * 
 * This stack is optional and only needed if deploying to AWS EC2
 * instead of Render or other hosting platforms.
 * 
 * Cost: ~$7.50/month for t3.micro running 24/7
 * 
 * Current instance: i-0f6a391245b1f0d26 (tamu-law-portal)
 * Public IP: 44.193.183.185
 */
export class Ec2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Security group for the web server
    const webServerSg = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc,
      description: 'Allow HTTP/HTTPS and SSH access',
      allowAllOutbound: true,
    });

    // Allow HTTP
    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // Allow HTTPS
    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    // Allow SSH from your IP only (update this)
    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(), // TODO: Restrict to specific IP for security
      ec2.Port.tcp(22),
      'Allow SSH'
    );

    // Allow Node.js backend port
    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      'Allow Node.js backend'
    );

    // IAM role for EC2 with S3 and Secrets Manager access
    const role = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Grant S3 access
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: ['arn:aws:s3:::resume-storage-tamu-law/*'],
      })
    );

    // Grant Secrets Manager access
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['arn:aws:secretsmanager:us-east-1:*:secret:DbSecret*'],
      })
    );

    // Latest Amazon Linux 2023 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // EC2 instance
    const instance = new ec2.Instance(this, 'WebServer', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: webServerSg,
      role,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      // User data to install Node.js and setup application
      userData: ec2.UserData.forLinux(),
    });

    // Add user data script
    instance.userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y git',
      // Install Node.js 20
      'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -',
      'yum install -y nodejs',
      // Install PM2 for process management
      'npm install -g pm2',
      'echo "EC2 instance ready for deployment"',
    );

    new cdk.CfnOutput(this, 'InstanceId', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'PublicIP', { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, 'PublicDNS', { value: instance.instancePublicDnsName });
  }
}
