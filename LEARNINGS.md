# My First App In Cloud Foundry - What I Actually Learned

## What I Built and Why

So I decided to dive into SAP BTP and figure out how to deploy a Node.js app with proper DevOps practices. Nothing fancy - just a simple Express.js app with some basic security middleware, logging with Winston, and Jest tests. The goal was to understand the full deployment pipeline on Cloud Foundry.

## Getting Started with CF CLI - The Basics That Actually Matter

The first thing you need to know is how to talk to Cloud Foundry. Here's what I found myself using constantly:

```bash
cf api https://api.cf.us10-001.hana.ondemand.com  # Point to your region
cf login                                          # Get authenticated
cf apps                                          # See what's running
cf push --random-route                           # Deploy without route conflicts
cf buildpacks                    # See what buildpacks are available
cf stacks                        # Check available stacks (cflinuxfs4 is common)
cf space dev                     # Get details about your space and quotas
cf quota {quota-name}            # Check your quota limitations (very important!)

cf app {app-name}                # Detailed info about a specific app
cf logs {app-name}               # Stream live logs (lifesaver for debugging)
cf logs {app-name} --recent      # Get recent logs without streaming
cf restart {app-name}            # Restart your app
cf stop {app-name}               # Stop an app
cf start {app-name}              # Start a stopped app
cf delete {app-name}             # Remove an app completely
```


## The Reality of Trial Account Limitations

Here's where things got interesting (and frustrating). I had this grand plan to deploy my app, but Cloud Foundry just said "nope" - insufficient memory quota.

This taught me something important: trial accounts are great for learning the concepts, but if you want to do anything real, you need to upgrade to at least PAYG (Pay-As-You-Go).

## Deployment Options - What Actually Works

I tried three different approaches:

### CF CLI - The Developer's Choice
This is where I started and honestly, it's still my favorite for development. Direct command line control, easy to script, and you can see exactly what's happening.

### BTP Cockpit UI - Quick and Dirty
The drag-and-drop ZIP upload is surprisingly useful for quick tests. Not something you'd use in production, but when you want to quickly verify something works, it's there.

### CI/CD Pipeline - The Real Deal
This is where it gets professional, but also where I learned the most (and hit the most walls).

## The CI/CD Pipeline Adventure

Setting up the CI/CD service was actually straightforward:
1. Subscribe to "Continuous Integration & Delivery" service
2. Get the "CICD Service Administrator" role
3. Set up credentials for CF and GitHub

But then came the real learning...

## The Great Environment Configuration Challenge

Here's where I spent way too much time figuring things out. I had this idea: use one pipeline configuration file and parameterize it to deploy to different spaces (dev, staging, prod). Sounds logical, right?

**Plot twist: it doesn't work that way in Source Repository mode.**

The pipeline configuration in `.pipeline/config.yml` is pretty static. You can't easily inject runtime variables to change which space you're deploying to. I tried various approaches, but the space configuration gets baked in:

```yaml
Release:
  cloudFoundryDeploy: true
  cloudFoundry:
    space: 'dev'  # This is basically hardcoded
```

## The Solution I Actually Use Now

After banging my head against parameterization, I discovered the Job Editor approach works much better for multi-environment deployments. Here's what I ended up doing:

1. **Created separate spaces**: `dev`, `stage`, `prod`
2. **Used different Git branches**: `main` → dev, `stage` → staging, `prod` → production
3. **Set up separate jobs in the Job Editor**, each targeting:
   - Different branch
   - Different space
   - Same repository

This actually works great! Each environment has its own deployment job, but they all use the same codebase. When I want to promote code, I just merge branches and the appropriate pipeline kicks off.

## Simplifying the Build Process

One more thing I figured out along the way - I ended up **deleting the `mta.yaml` file entirely**. Turns out you don't actually need it, as I could select npm as a build tool in the Job Editor.
Less configuration files to maintain, and honestly, less things that can break.

## Spaces vs Subaccounts - The Architecture Decision

Initially, I thought spaces were just for organizing apps. But I learned they can actually work for environment separation too. However, the more I dug into it, the more I realized that **subaccounts are probably the better approach** for proper dev/stage/prod separation. Here's why:

- **Spaces**: Good for organizing different apps or teams within the same environment
- **Subaccounts**: Better for true environment isolation with separate billing, quotas, and access controls

For a real enterprise setup, I'd probably go with separate subaccounts for each environment, then use spaces within each subaccount to organize different applications or microservices.

## The Bottom Line

SAP BTP Cloud Foundry is solid once you understand its quirks. The CLI tools are powerful, the CI/CD integration works well (once you figure out the environment strategy), and the platform handles the boring infrastructure stuff so you can focus on your application.
