const https = require('https');
const http = require('http');

// 10 GRC Security test questions
const questions = [
  "What's the difference between ABAP modifications and extensions?",
  "Explain Access Risk Analysis (ARA) and how it works.",
  "What's your philosophy on segregation of duties in SAP?",
  "How do you approach a situation where access control design conflicts with business need?",
  "Explain how IAS (Identity Authentication Service) integrates with S/4HANA security.",
  "Walk me through your approach to a critical access violation found in an audit.",
  "Compare on-premise GRC vs cloud-native GRC. What changes?",
  "What makes an excellent GRC security architect?",
  "Tell me about a time you implemented segregation of duties in a complex environment.",
  "Describe your approach to designing a GRC security strategy for a new S/4HANA implementation."
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
        try {
          const response = JSON.parse(data);
          resolve({
            question,
            response,
            latency,
            statusCode: res.statusCode
          });
        } catch (e) {
          resolve({
            question,
            response: data,
            latency,
            statusCode: res.statusCode,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== GRC Security Quality Diagnostic Test ===\n');
  console.log(`Testing ${questions.length} questions...\n`);
  
  const results = [];
  for (let i = 0; i < questions.length; i++) {
    console.log(`[${i+1}/${questions.length}] Testing: "${questions[i].substring(0, 50)}..."`);
    try {
      const result = await testQuestion(questions[i]);
      results.push(result);
      console.log(`  ✓ Latency: ${result.latency}ms, Status: ${result.statusCode}`);
      console.log(`  Response length: ${typeof result.response === 'string' ? result.response.length : JSON.stringify(result.response).length} chars\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('grc_test_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to grc_test_results.json');
  
  // Print summary
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  console.log(`\nSummary:`);
  console.log(`- Tests completed: ${results.length}/${questions.length}`);
  console.log(`- Average latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`- Min latency: ${Math.min(...results.map(r => r.latency))}ms`);
  console.log(`- Max latency: ${Math.max(...results.map(r => r.latency))}ms`);
}

runTests().catch(console.error);
