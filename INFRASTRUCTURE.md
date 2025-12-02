# AWS Infrastructure Documentation

## Overview
This document describes all AWS resources used by the TAMU Law Adjunct Hiring Portal.

**AWS Account ID**: `176376308053`  
**Primary Region**: `us-east-1` (N. Virginia)  
**S3 Region**: `us-east-2` (Ohio)

---

##  Current AWS Resources

### 1. **RDS PostgreSQL Database** 
- **Stack**: `LawRdsStack` (CloudFormation)
- **Instance ID**: `lawrdsstack-lawpostgres-enc`
- **Instance Type**: `db.t3.micro`
- **Engine**: PostgreSQL 16.8 with pgvector extension
- **Storage**: 20 GB (General Purpose SSD)
- **Endpoint**: `lawrdsstack-lawpostgres-enc.ca32806iskx7.us-east-1.rds.amazonaws.com:5432`
- **Database Name**: `law_portal`
- **Username**: `tamu`
- **Publicly Accessible**: Yes (for development)
- **Backup Retention**: 7 days (default)
- **Multi-AZ**: No
- **Encryption**: At rest enabled
- **Estimated Cost**: **~$13-15/month**

**Tables**:
- `applicants` (102 records)
- `resumes` (103 records with vector embeddings)
- `chat_sessions` (42 records)
- `chat_messages` (101 records)
- `course_catalog` (291 law courses)

**Security**:
- Security Group allows PostgreSQL (5432) from specific IP
- Credentials stored in AWS Secrets Manager

---

### 2. **S3 Bucket** 
- **Bucket Name**: `resume-storage-tamu-law`
- **Region**: `us-east-2` (Ohio)
- **Size**: 53.1 MiB (112 objects)
- **Versioning**: Disabled
- **Encryption**: S3-managed (SSE-S3)
- **Public Access**: Blocked (all)
- **CORS**: Enabled for frontend access
- **Estimated Cost**: **~$0.10/month** (negligible)

**Usage**:
- Stores uploaded resume PDFs
- Accessed via presigned URLs
- Backend generates temporary download links

---

### 3. **AWS Secrets Manager** 
- **Secret Name**: `DbSecret685A0FA5-BaG9GAuh6AYh`
- **ARN**: `arn:aws:secretsmanager:us-east-1:176376308053:secret:DbSecret685A0FA5-BaG9GAuh6AYh-jjYIXi`
- **Contains**: Database credentials (username: `tamu`, password)
- **Rotation**: Not configured (manual updates)
- **Last Accessed**: 2025-10-21
- **Estimated Cost**: **$0.40/month + $0.05 per 10,000 API calls**

---

### 4. **EC2 Instance**  (Optional)
- **Instance ID**: `i-0f6a391245b1f0d26`
- **Name**: `tamu-law-portal`
- **Instance Type**: `t3.micro`
- **Public IP**: `44.193.183.185`
- **Public DNS**: `ec2-44-193-183-185.compute-1.amazonaws.com`
- **AMI**: Amazon Linux 2023
- **Status**: **RUNNING** 
- **Security Group**: `sg-00a0ef92bd884ce23` (law-portal-sg)
- **Estimated Cost**: **~$7.50/month** (if running 24/7)

** IMPORTANT**: This EC2 instance is **optional**. You can:
1. **Keep it** if you want to host on AWS
2. **Stop it** if using Render or other platforms (saves $7.50/month)
3. **Terminate it** if no longer needed

**Current Security Group Rules**:
- Port 22 (SSH) - Open to all ( should restrict to your IP)
- Port 80 (HTTP) - Open to all
- Port 443 (HTTPS) - Open to all
- Port 3000 (Node.js) - Open to all

---

### 5. **VPC and Networking** 
- **VPC ID**: `vpc-0d970f0c0ed85cf4b` (Default VPC)
- **CIDR**: `172.31.0.0/16`
- **Region**: `us-east-1`
- **NAT Gateways**: **None**  (saves $32/month per NAT Gateway)
- **Subnets**: Using default public subnets
- **Internet Gateway**: Yes (free with VPC)
- **Estimated Cost**: **FREE**

---

### 6. **Elastic Beanstalk** (Inactive)
- **Application**: `github-setup-tamu-law`
- **Environments**: None (deleted)
- **S3 Bucket**: `elasticbeanstalk-us-east-1-176376308053`
- **Status**: Application exists but no active environments
- **Estimated Cost**: **FREE** (only metadata stored)

---

### 7. **CDK Bootstrap Resources**
- **CloudFormation Stack**: `CDKToolkit`
- **S3 Bucket**: `cdk-hnb659fds-assets-176376308053-us-east-1`
- **Purpose**: Stores CDK deployment assets
- **Estimated Cost**: **< $0.10/month**

---

##  Total Monthly Cost Estimate

| Resource | Estimated Cost |
|----------|---------------|
| RDS PostgreSQL (db.t3.micro, 20GB) | $13-15/month |
| S3 Bucket (53 MiB storage) | $0.10/month |
| Secrets Manager (1 secret) | $0.40/month |
| EC2 Instance (t3.micro) | $7.50/month  |
| VPC | FREE |
| Data Transfer | ~$1-2/month |
| **TOTAL** | **~$22-25/month** |

**Cost Optimization**:
-  No NAT Gateways (saves $32/month)
-  No Load Balancer (saves $16/month)
-  EC2 instance is optional - can stop/terminate if using Render

---

##  Infrastructure as Code

### CDK Stacks

#### 1. **RdsStack** (`infra/src/lib/rds-stack.ts`)
- Deploys PostgreSQL RDS instance
- Creates security group
- Stores credentials in Secrets Manager
- Status: **Deployed** 

```bash
cdk deploy LawRdsStack -c myIp=YOUR_IP
```

#### 2. **S3Stack** (`infra/src/lib/s3-stack.ts`)
- Creates S3 bucket for resume storage
- Configures CORS for frontend access
- Sets up lifecycle policies
- Status: **Needs deployment** (bucket exists, stack not in CloudFormation)

```bash
cdk deploy LawS3Stack
```

#### 3. **Ec2Stack** (`infra/src/lib/ec2-stack.ts`) - **OPTIONAL**
- Deploys EC2 instance for hosting
- Configures security groups
- Sets up IAM roles for S3/Secrets Manager access
- Status: **Optional** (instance exists but not managed by CDK)

```bash
# Only deploy if you want AWS hosting
cdk deploy LawEc2Stack
```

---

##  Deployment Options

### Option 1: AWS EC2 (Current)
- **Cost**: ~$22-25/month
- **Setup**: EC2 instance + RDS + S3
- **Pros**: Full control, all in AWS
- **Cons**: More expensive, requires maintenance

**Current Status**: EC2 instance `i-0f6a391245b1f0d26` is RUNNING

### Option 2: Render + AWS RDS/S3 (Recommended)
- **Cost**: ~$15-18/month ($0 Render free tier + $15 AWS)
- **Setup**: Render web service + RDS + S3
- **Pros**: Cheaper, easier deployment, auto-scaling
- **Cons**: Less control over server

**To Switch**:
1. Stop/terminate EC2 instance: `aws ec2 stop-instances --instance-ids i-0f6a391245b1f0d26`
2. Deploy backend to Render
3. Keep RDS and S3 (same connection strings)

### Option 3: Local Development Only
- **Cost**: ~$15/month (just RDS + S3)
- **Setup**: Local Node.js + Docker + RDS + S3
- **Pros**: Cheapest for development
- **Cons**: Not accessible publicly

---

##  Security Best Practices

### Current Issues 
1. **RDS is publicly accessible** - OK for development, but restrict in production
2. **EC2 SSH is open to all** - Should restrict to your IP only
3. **Secrets in .env file** - Should use AWS Secrets Manager or environment variables

### Recommended Improvements
1. **Restrict RDS access**: Only allow connections from EC2 instance or your IP
2. **Use IAM roles**: EC2 instance should use IAM role to access RDS/S3 (no hardcoded credentials)
3. **Enable RDS encryption**: Already enabled 
4. **Enable S3 versioning**: Consider enabling for backup
5. **Set up CloudWatch alarms**: Monitor RDS CPU, storage, connections
6. **Enable RDS automated backups**: Already enabled (7 days) 

---

##  Maintenance Tasks

### Weekly
- [ ] Check RDS storage usage
- [ ] Review S3 costs
- [ ] Monitor application logs

### Monthly
- [ ] Review AWS bill
- [ ] Update security groups if needed
- [ ] Check for unused resources

### As Needed
- [ ] Update database schema
- [ ] Rotate secrets
- [ ] Update EC2 instance software

---

##  Common Operations

### View RDS connection string
```bash
aws secretsmanager get-secret-value --secret-id DbSecret685A0FA5-BaG9GAuh6AYh --region us-east-1
```

### Stop EC2 instance (save costs)
```bash
aws ec2 stop-instances --instance-ids i-0f6a391245b1f0d26 --region us-east-1
```

### Start EC2 instance
```bash
aws ec2 start-instances --instance-ids i-0f6a391245b1f0d26 --region us-east-1
```

### Check S3 bucket size
```bash
aws s3 ls s3://resume-storage-tamu-law --recursive --human-readable --summarize
```

### Backup RDS database
```bash
aws rds create-db-snapshot \
  --db-instance-identifier lawrdsstack-lawpostgres-enc \
  --db-snapshot-identifier law-portal-backup-$(date +%Y%m%d) \
  --region us-east-1
```

---

##  Support Contacts

- **AWS Account Owner**: anikmomin
- **AWS Account ID**: 176376308053
- **Region**: us-east-1 (primary), us-east-2 (S3)
- **Capstone Team**: TAMU CSCE 482 Fall 2025

---

##  Infrastructure Updates

**Last Updated**: December 2, 2025  
**Updated By**: GitHub Copilot (automated audit)

### Recent Changes
-  Verified all AWS resources
-  Updated CDK stack documentation
-  Created S3Stack and Ec2Stack
-  Documented EC2 instance as optional
-  Added cost estimates and optimization tips
