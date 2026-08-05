const http = require('http');

// Comprehensive test across multiple question types to validate architect voice is working consistently
const testQuestions = [
  // GRC/Security (original test set)
  { question: "What's the difference between ABAP modifications and extensions?", category: "GRC" },
  { question: "Explain Access Risk Analysis (ARA) and how it works.", category: "GRC" },
  { question: "What's your philosophy on segregation of duties in SAP?", category: "GRC" },
  
  // Behavioral/Leadership (should show architect thinking about people)
  { question: "Tell me about your leadership style and how you develop junior staff.", category: "Behavioral" },
  { question: "Describe a conflict you resolved between security requirements and business needs.", category: "Behavioral" },
  
  // Architecture/Design (should show system thinking)
  { question: "How would you design a GRC security strategy for a new S/4HANA implementation?", category: "Architecture" },
  { question: "Compare on-premise GRC vs cloud-native GRC. What changes?", category: "Architecture" },
  
  // Implementation (should show practical approach)
  { question: "Walk me through implementing segregation of duties in a complex multi-entity environment.", category: "Implementation" },
  { question: "What's your approach to a critical access violation found during an audit?", category: "Implementation" },
  
  // Philosophy/Self-reflection (should show architect perspective)
  { question: "What makes an excellent SAP security architect?", category: "Philosophy" }
];

async function testQuestion(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      question: question,
      context: ""
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        // Extract text from streaming response
        const textMatches = data.match(/data: \{"text":"([^"]*?)"\}/g) || [];
        const fullText = textMatches.map(m => m.match(/"text":"([^"]*)"/)[1]).join('') || '';
        
        // Check for architect voice signals
        const signals = {
          businessContext: /this matters because|the key tension|why|strategic|business impact/i.test(fullText),
          sapComponents: /pfcg|su01|su24|ara|arm|eam|brm|ias|t-code|transaction|module/i.test(fullText),
          tradeOffs: /trade-off|tension|balance|cost-benefit|approach|experience|my experience|i've|what i've seen/i.test(fullText),
          conversational: /i |my |we |our |you |let me|here's|the key|what|why|how/i.test(fullText),
          confidence: /i approach|i believe|i recommend|my experience|here's how|the way/i.test(fullText)
        };
        
        resolve({
          question,
          latency,
          textPreview: fullText.substring(0, 300),
          textLength: fullText.length,
          signals
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runValidation() {
  console.log('=== COMPREHENSIVE PRIORITY 1 VALIDATION ===\n');
  console.log('Testing architect voice across 10 diverse questions\n');
  
  const results = [];
  
  for (let i = 0; i < testQuestions.length; i++) {
    const test = testQuestions[i];
    console.log(`[${i+1}/10] ${test.category}: "${test.question.substring(0, 60)}..."`);
    
    try {
      const result = await testQuestion(test.question);
      results.push({ ...test, ...result });
      
      const signals = result.signals;
      const signalCount = Object.values(signals).filter(Boolean).length;
      const grade = signalCount >= 4 ? '✅' : signalCount >= 3 ? '⚠️' : '❌';
      
      console.log(`  ${grade} Signals: ${signalCount}/5 | Latency: ${result.latency}ms | Length: ${result.textLength} chars`);
      console.log(`     Preview: "${result.textPreview.substring(0, 80)}..."\n`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Summary statistics
  console.log('=== VALIDATION SUMMARY ===\n');
  
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const avgLength = results.reduce((sum, r) => sum + r.textLength, 0) / results.length;
  
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    const signalCount = Object.values(r.signals).filter(Boolean).length;
    byCategory[r.category].push(signalCount);
  });
  
  console.log('By Category:');
  Object.entries(byCategory).forEach(([cat, signals]) => {
    const avg = (signals.reduce((a, b) => a + b, 0) / signals.length).toFixed(1);
    console.log(`  ${cat}: ${avg}/5 avg signals`);
  });
  
  console.log(`\nPerformance Metrics:`);
  console.log(`  Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`  Average Response Length: ${avgLength.toFixed(0)} chars`);
  
  const allSignals = results.map(r => Object.values(r.signals).filter(Boolean).length);
  const passCount = allSignals.filter(s => s >= 4).length;
  const passRate = ((passCount / allSignals.length) * 100).toFixed(1);
  
  console.log(`\nArchitect Voice Detection:`);
  console.log(`  Pass Rate (≥4/5 signals): ${passRate}%`);
  console.log(`  Min Signals: ${Math.min(...allSignals)}`);
  console.log(`  Max Signals: ${Math.max(...allSignals)}`);
  
  // Save detailed results
  const fs = require('fs');
  fs.writeFileSync('priority1_validation_results.json', JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to priority1_validation_results.json`);
  
  // Final verdict
  console.log(`\n=== PRIORITY 1 VERDICT ===`);
  if (passRate >= 80) {
    console.log(`✅ PRODUCTION READY - Architect voice consistently present (${passRate}% pass rate)`);
  } else if (passRate >= 70) {
    console.log(`⚠️  ACCEPTABLE - Architect voice mostly working (${passRate}% pass rate, review failing cases)`);
  } else {
    console.log(`❌ NEEDS WORK - Architect voice inconsistent (${passRate}% pass rate)`);
  }
}

runValidation().catch(console.error);
