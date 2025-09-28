# SAP BTP Cloud Foundry Deployment Learnings

## Project Overview
Deployed a Node.js application demonstrating DevOps practices on SAP Business Technology Platform (BTP) Cloud Foundry runtime with automated CI/CD pipeline.

## Application Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Key Dependencies**: Winston (logging), Helmet (security), Compression, CORS
- **Testing**: Jest with Supertest
- **Monitoring**: Health check endpoints

## Cloud Foundry CLI Commands Learned

### Initial Setup & Connection
```bash
cf api https://api.cf.us10-001.hana.ondemand.com  # Set API endpoint
cf api                                            # Verify current endpoint
cf login                                          # Interactive authentication
```

### Deployment Commands
```bash
cf push                          # Basic deployment (failed due to resource limits)
cf push --random-route          # Deploy with random route to avoid conflicts
cf apps                         # List all deployed applications and status
```

### Environment Information
```bash
cf buildpacks                   # Available buildpacks (nodejs_buildpack used)
cf stacks                       # Available stacks (cflinuxfs4)
cf space dev                    # Space details and resource quotas
cf quota {quota-name}           # Check quota limitations
```

## Deployment Methods Explored

### 1. CF CLI (Command Line)
- Most flexible and scriptable approach
- Direct integration with development workflow
- Failed initially due to trial account resource limitations

### 2. BTP Cockpit UI (Manual Upload)
- Drag-and-drop ZIP file deployment
- Good for testing and small deployments
- Less suitable for production workflows

### 3. CI/CD Pipeline (Automated)
- Most professional approach for enterprise development
- Integrated testing, building, and deployment
- Required additional service setup and permissions

## CI/CD Pipeline Implementation

### BTP CI/CD Service Setup
1. **Service Subscription**: Added "Continuous Integration & Delivery" service
2. **Role Collections**: Assigned "CICD Service Administrator" role to user
3. **Credentials Configuration**:
   - `cf-credentials`: Basic Auth with BTP username/password
   - `github-credentials`: Personal Access Token for repository access
   - `webhook`: Secret for GitHub webhook integration

### Pipeline Configuration (Source Repository Mode)
```yaml
general:
  pipeline: 'sap-cloud-sdk'
    
stages:
  Build:
    npmExecuteScripts: true
    
  Additional Unit Tests:
    npmExecuteScripts:
      runScripts: ["test"]
    testResultsFiles: 'test-results.xml'
    
  Release:
    cloudFoundryDeploy: true
    mtaBuild: true
    mtaDeploy: true
    cloudFoundry:
      apiEndpoint: 'https://api.cf.us10-001.hana.ondemand.com'
      org: '7e3bbfebtrial'
      space: 'dev'
      credentialsId: 'cf-credentials'
```

### MTA Deployment Descriptor
```yaml
_schema-version: "3.1"
ID: sap-btp-devops-lifecycle
version: 1.0.0
modules:
  - name: sap-btp-devops-lifecycle
    type: nodejs
    path: .
    parameters:
      buildpack: nodejs_buildpack
      memory: 256M
      disk-quota: 512M
resources:
  - name: sap-btp-devops-lifecycle-logs
    type: org.cloudfoundry.managed-service
    parameters:
      service: application-logs
      service-plan: lite
```

## Challenges Encountered

### 1. Resource Limitations (Trial Account)
- **Issue**: Insufficient memory quota for deployment
- **Solution**: Requires upgrade to Enterprise PAYG account
- **Impact**: Limited to single small application instance

### 2. Multi-Environment Deployment
- **Goal**: Deploy using same pipeline to different spaces (dev, stage, prod)
- **Challenge**: No runtime environment variable injection in Source Repository mode
- **Current Limitation**: Space configuration hardcoded in pipeline file
- **Workaround**: Use separate Git branches with different pipeline jobs:
  - `main` branch → `dev` space
  - `stage` branch → `stage` space  
  - `prod` branch → `prod` space

### 3. Pipeline Configuration Mode Trade-offs
- **Job Editor Mode**: UI-based configuration, easier but less version-controlled
- **Source Repository Mode**: Code-based configuration, better for GitOps but less flexible for environment variables

## Key Insights

### Environment Strategy
- **Trial Account**: Suitable for learning and prototyping
- **Production**: Requires enterprise account with proper quotas
- **Best Practice**: Use separate subaccounts for different environments, not just spaces

## Architecture Decision Records
- **Deployment Platform**: Cloud Foundry chosen over Kyma for simpler Node.js applications
- **CI/CD Strategy**: Source Repository mode with branch-based environments
- **Application Architecture**: Stateless microservice with health monitoring endpoints