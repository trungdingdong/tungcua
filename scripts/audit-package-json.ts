#!/usr/bin/env ts-node
/**
 * Audit spike app package.json files to ensure they only contain the chosen candidate dependency
 * (no losing candidates).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function auditPackageJson(appPath: string, appName: string, allowedCandidates: string[]): { passed: boolean; issues: string[]; foundCandidates: string[] } {
  const issues: string[] = [];
  const foundCandidates: string[] = [];
  
  try {
    const content = readFileSync(resolve(appPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(content);
    
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    // Check for ML Kit related packages (Spike A)
    const mlkitCandidates = [
      '@react-native-ml-kit/text-recognition',
      '@infinitered/react-native-mlkit-text-recognition',
      'expo-mlkit-ocr',
      'react-native-mlkit-ocr',
      'react-native-mlkit-text-recognition',
      'react-native-mlkit-vision',
    ];
    
    // Check for PDF candidates (Spike B)
    const pdfCandidates = [
      'react-native-pdf',
      'pdfjs-dist',
      'react-native-pdf-lib',
    ];
    
    const allCandidates = [...mlkitCandidates, ...pdfCandidates];
    const found = allCandidates.filter(c => deps[c]);
    
    if (found.length > 1) {
      return {
        passed: false,
        issues: [`Multiple candidates found: ${found.join(', ')}. Only one should be present.`],
        foundCandidates: found
      };
    }
    
    if (found.length === 0) {
      return {
        passed: false,
        issues: ['No candidate dependency found in package.json'],
        foundCandidates: []
      };
    }
    
    // Check if the found candidate is in the allowed list
    const foundCandidate = found[0];
    if (!allowedCandidates.includes(foundCandidate)) {
      return {
        passed: false,
        issues: [`Found unexpected candidate: ${foundCandidate}. Expected one of: ${allowedCandidates.join(', ')}`],
        foundCandidates: found
      };
    }
    
    return {
      passed: true,
      issues: [],
      foundCandidates: [foundCandidate]
    };
    
  } catch (error) {
    return {
      passed: false,
      issues: [`Could not read package.json - ${error}`],
      foundCandidates: []
    };
  }
}

function main() {
  console.log('Auditing spike app package.json files for candidate dependencies...\n');
  
  // Spike A allowed candidates
  const spikeAAllowed = ['@react-native-ml-kit/text-recognition', '@infinitered/react-native-mlkit-text-recognition', 'expo-mlkit-ocr', 'react-native-mlkit-ocr'];
  
  // Spike B allowed candidates (only one should be chosen)
  const spikeBAllowed = ['react-native-pdf', 'pdfjs-dist', 'react-native-pdf-lib'];
  
  const spikeAResult = auditPackageJson('spikes/spike-a', 'Spike A', spikeAAllowed);
  const spikeBResult = auditPackageJson('spikes/spike-b', 'Spike B', spikeBAllowed);
  
  console.log('\n=== Spike A Audit ===');
  console.log(`Found candidates: ${spikeAResult.foundCandidates.join(', ') || 'none'}`);
  if (spikeAResult.passed) {
    console.log('PASS');
  } else {
    console.log('FAIL:');
    spikeAResult.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\n=== Spike B Audit ===');
  console.log(`Found candidates: ${spikeBResult.foundCandidates.join(', ') || 'none'}`);
  if (spikeBResult.passed) {
    console.log('PASS');
  } else {
    console.log('FAIL:');
    spikeBResult.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  const allPassed = spikeAResult.passed && spikeBResult.passed;
  if (allPassed) {
    console.log('\nALL AUDITS PASSED');
    process.exit(0);
  } else {
    console.log('\nAUDIT FAILED');
    process.exit(1);
  }
}

main();