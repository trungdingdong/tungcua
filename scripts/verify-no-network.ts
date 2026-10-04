#!/usr/bin/env ts-node
/**
 * Verify no network permission in release config for both spike apps.
 * This script checks that android.permission.INTERNET is absent from Android release manifest
 * and iOS network entitlements are absent in both spike apps' app.config.ts release profiles.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function checkAppConfig(appPath: string, appName: string): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const configPath = resolve(appPath, 'app.config.ts');
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    
    // Check for network permission in android.permissions
    if (content.includes("'INTERNET'") || content.includes('"INTERNET"')) {
      issues.push(`${appName}: android.permission.INTERNET found in app.config.ts`);
    }
    
    // Check for network permission in android.permissions array
    if (content.includes('android.permission.INTERNET')) {
      issues.push(`${appName}: android.permission.INTERNET found in app.config.ts`);
    }
    
    // Check for iOS network entitlements
    if (content.includes('com.apple.developer.networking') || content.includes('com.apple.developer.networking.wifi-info')) {
      issues.push(`${appName}: iOS network entitlement found in app.config.ts`);
    }
    
    // Check for release profile without network permission
    if (content.includes('release') && content.includes('INTERNET')) {
      issues.push(`${appName}: release profile appears to have network permission`);
    }
    
  } catch (error) {
    issues.push(`${appName}: Could not read app.config.ts - ${error}`);
  }
  
  return { passed: issues.length === 0, issues };
}

function main() {
  const spikeAPath = resolve('spikes', 'spike-a');
  const spikeBPath = resolve('spikes', 'spike-b');
  
  console.log('Verifying no network permission in release config...\n');
  
  const spikeAResult = checkAppConfig(spikeAPath, 'Spike A');
  const spikeBResult = checkAppConfig(spikeBPath, 'Spike B');
  
  const allIssues = [...spikeAResult.issues, ...spikeBResult.issues];
  
  if (allIssues.length === 0) {
    console.log('PASS: No network permissions found in release config for both spikes');
    process.exit(0);
  } else {
    console.log('FAIL: Network permission issues found:');
    allIssues.forEach(issue => console.log(`  - ${issue}`));
    process.exit(1);
  }
}

main();